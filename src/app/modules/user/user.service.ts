import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import { UserSearchableFields } from "./user.constant";
import { TUser } from "./user.interface";
import { User } from "./user.model";
import AppError from "../../errors/AppError";

const getAllUserFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(
    User.find()
      .populate({ path: 'departmentId', select: 'departmentName' })
      .populate({ path: 'trainingId', select: 'name' })
      .populate({ path: 'designationId', select: 'title' }),
    query
  )
    .search(UserSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await userQuery.countTotal();
  const result = await userQuery.modelQuery;

  return {
    meta,
    result,
  };
};


const getSingleUserFromDB = async (id: string) => {
  const result = await User.findById(id).populate("colleagues company");
  return result;
};

const updateUserIntoDB = async (id: string, payload: Partial<TUser>) => {
  const user = await User.findById(id);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};


const getAllUserByCompany = async (userId: string) => {
  const user = await User.findById(userId).populate('colleagues'); ;
  if (!user) {
    return null;
  }

  const query: any = {
    isDeleted: false,
    _id: { $ne: userId }, // Exclude the current user
  };

  // Determine the user's role and set the query accordingly
  if (user.role === 'admin' || user.role === 'director') {
    // Fetch users with roles 'admin' or 'director' and not deleted
    const query = { $or: [
      { role: { $in: ['admin', 'director'] } }, // Fetch admins and directors
      { _id: { $in: user.colleagues || [] } }  // Include the user's colleagues
    ], isDeleted: false };
    let filteredUsers = await User.find(query).lean();
  
    // Move the current user to the top of the list
    filteredUsers = filteredUsers.sort((a, b) => (a._id.toString() === user.id ? -1 : b._id.toString() === user.id ? 1 : 0));
  
    return filteredUsers;
  }
  

  else if (user.role === 'company') {
    const query = { 
      company: user._id, 
      role: { $in: ['creator', 'user'] } ,
      isDeleted: false
    };
    const companyUsers = await User.find(query).lean();

      // Include colleagues in the query
      if (user.colleagues?.length) {
        const colleagues = await User.find({ _id: { $in: user.colleagues }, isDeleted: false }).lean();
        companyUsers.push(...colleagues);
      }

      
    if (!companyUsers.some(existingUser => existingUser._id.toString() === user._id.toString())) {
      companyUsers.unshift(user);  // Add the user to the list
    }
    return companyUsers // Return users from the same company
  }


  else if (user.role === 'creator') {
    const companyId = user.company; // Get the company ID of the user

    // Build the query to fetch all users with the same company ID
    query.company = companyId;  // Only users who share the same company ID
    query.isDeleted = false; 

    // Execute the query to find users
    const users = await User.find(query).lean();

    if (companyId && !users.some(user => user._id.toString() === companyId.toString())) {
      const company = await User.findById(companyId).lean(); // Fetch the company as a user
      if (company && company.isDeleted === false) {
        // Add the company to the users list if it's not deleted
        users.unshift(company); // Insert the company at the beginning
      }
    }


 // Include colleagues in the query
 if (user.colleagues?.length) {
  const colleagues = await User.find({ _id: { $in: user.colleagues }, isDeleted: false }).lean();
  users.push(...colleagues);
}

    if (!users.some(existingUser => existingUser._id.toString() === user._id.toString())) {
      users.unshift(user);  // Add the user to the list
    }
  
    return users;
  }


  else if (user.role === 'user' ) {
    // Users can only see their colleagues

    const colleaguesIds = user.colleagues || [];
    query.$or = [
      { _id: { $in: colleaguesIds } }, // Fetch users from the colleagues array
      // { company: user.company }, // Include users from the same company
  
    ];
    if (user.company) {
      query.$or.unshift({ _id: user.company });
    }
    const colleagues = await User.find(query).lean(); // Fetch colleagues based on the query
  
      // Include the user's own ID in the list if it's not already included
  if (!colleagues.some(existingUser => existingUser._id.toString() === user._id.toString())) {
    colleagues.unshift(user); // Add the user to the colleagues list
  }

    return colleagues; // Return only the colleagues
  }

  
  const users = await User.find(query);
  return users;
};



const assignUserToDB = async (id: string, payload: { colleagueId: string; action: 'add' | 'remove' }) => {
  const session = await User.startSession(); // Declare session outside
  session.startTransaction();

  try {
    const [user, colleague] = await Promise.all([
      User.findById(id),
      User.findById(payload.colleagueId)
    ]);

    if (!user || !colleague) {
      throw new AppError(httpStatus.NOT_FOUND, "User or colleague not found");
    }

    if (payload.action === 'add') {
      // Add colleagueId to user's colleagues array
      await User.findByIdAndUpdate(
        id,
        { $addToSet: { colleagues: payload.colleagueId } },
        { new: true, session }
      );

      // Add userId to colleague's colleagues array
      await User.findByIdAndUpdate(
        payload.colleagueId,
        { $addToSet: { colleagues: id } },
        { new: true, session }
      );
    } else if (payload.action === 'remove') {
      // Remove colleagueId from user's colleagues array
      await User.findByIdAndUpdate(
        id,
        { $pull: { colleagues: payload.colleagueId } },
        { new: true, session }
      );

      // Remove userId from colleague's colleagues array
      await User.findByIdAndUpdate(
        payload.colleagueId,
        { $pull: { colleagues: id } },
        { new: true, session }
      );
    }

    // Commit the transaction
    await session.commitTransaction();
    
    // Fetch the updated user document
    const updatedUser = await User.findById(id).populate('colleagues'); // Populate if you want colleague details

    return updatedUser; // Return the updated user data
  } catch (error: any) {
    // Rollback the transaction on error
    await session.abortTransaction();
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error?.message);
  } finally {
    // End the session in the finally block to ensure it's called
    session.endSession();
  }
};


export const UserServices = {
  getAllUserFromDB,
  getSingleUserFromDB,
  updateUserIntoDB,
  getAllUserByCompany,
  assignUserToDB
};
