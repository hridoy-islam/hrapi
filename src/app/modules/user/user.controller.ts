import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { UserServices } from "./user.service";

const getAllUser: RequestHandler = catchAsync(async (req, res) => {
  const result = await UserServices.getAllUserFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users retrived succesfully",
    data: result,
  });
});
const getSingleUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserServices.getSingleUserFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User is retrieved succesfully",
    data: result,
  });
});

const updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserServices.updateUserIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User is updated succesfully",
    data: result,
  });
});

const getCompanyUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await UserServices.getAllUserByCompany(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All Users Fetched Successfully",
    data: result,
  });
});

const assignUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserServices.assignUserToDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Colleagues Updated Successfully",
    data: result,
  });
});

export const UserControllers = {
  getAllUser,
  getSingleUser,
  updateUser,
  getCompanyUser,
  assignUser,
};
