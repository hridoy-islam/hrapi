import { FilterQuery, Query } from "mongoose";

class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public query: Record<string, unknown>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  // search(searchableFields: string[]) {
  //   const searchTerm = this?.query?.searchTerm;
  //   if (searchTerm) {
  //     this.modelQuery = this.modelQuery.find({
  //       $or: searchableFields.map(
  //         (field) =>
  //           ({
  //             [field]: { $regex: searchTerm, $options: "i" },
  //           }) as FilterQuery<T>
  //       ),
  //     });
  //   }

  //   return this;
  // }

  search(searchableFields: string[]) {
    const searchTerm = this?.query?.searchTerm as string;
    if (searchTerm) {
      const searchTerms = searchTerm
        .split(" ")
        .filter((term) => term.trim() !== ""); // Split into individual terms

      // Create an array of conditions for each term
      const searchConditions = searchTerms.map((term) => ({
        $or: searchableFields.map(
          (field) =>
            ({
              [field]: { $regex: term, $options: "i" }, // Case-insensitive regex for each field
            }) as FilterQuery<T>
        ),
      }));

      // Combine all conditions with $and to ensure all terms are matched
      if (searchConditions.length > 0) {
        this.modelQuery = this.modelQuery.find({
          $and: searchConditions,
        });
      }
    }

    return this;
  }

  filter(filters: { [x: string]: unknown }) {
    const queryObj = { ...this.query }; // copy

    // Filtering
    const excludeFields = ["searchTerm", "sort", "limit", "page", "fields"];

    excludeFields.forEach((el) => delete queryObj[el]);

    this.modelQuery = this.modelQuery.find(queryObj as FilterQuery<T>);

    return this;
  }

  sort() {
    const sort =
      (this?.query?.sort as string)?.split(",")?.join(" ") || "-createdAt";
    this.modelQuery = this.modelQuery.sort(sort as string);

    return this;
  }

  paginate() {
    const limitParam = this?.query?.limit;

    const page = Number(this?.query?.page) || 1;

    if (limitParam === "all") {
      // Return all records: no limit, no skip
      this.modelQuery = this.modelQuery.skip(0); // Optional: skip(0) for consistency
    } else {
      const limit = Number(limitParam) || 10;
      const skip = (page - 1) * limit;
      this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    }
    return this;
  }

  fields() {
    const fields =
      (this?.query?.fields as string)?.split(",")?.join(" ") || "-__v";

    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }
  async countTotal() {
    const limitParam = this?.query?.limit;
    const totalQueries = this.modelQuery.getFilter();
    const total = await this.modelQuery.model.countDocuments(totalQueries);
    const page = Number(this?.query?.page) || 1;
    // const limit = Number(this?.query?.limit) || 10;
    const limit = limitParam === "all" ? total : Number(limitParam) || 10;
    const totalPage = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPage,
    };
  }
}

export default QueryBuilder;
