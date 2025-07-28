import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken";
import config from "../config";
import AppError from "../errors/AppError";
import { TUserRole } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import catchAsync from "../utils/catchAsync";

const auth = (...requiredRoles: TUserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    // checking if the token is missing
    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized!");
    }

    try {
      const decoded = jwt.verify(
        token,
        config.jwt_access_secret as string
      ) as JwtPayload;
      // const decoded = jwt.verify(token, config.jwt_access_secret as string) as JwtPayload

      // checking if the given token is valid

      const { email, role } = decoded;

      // checking if the user is exist
      const user = await User.findOne({ email });

      if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "This user is not found !");
      }
      // checking if the user is already deleted

      // checking if the user is blocked
      // const userStatus = user?.isDeleted;

      // if (!userStatus) {
      //   throw new AppError(httpStatus.FORBIDDEN, 'This user is Deleted ! !');
      // }

      if (requiredRoles && !requiredRoles.includes(role)) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "You are not authorized  hi!"
        );
      }

      req.user = decoded as JwtPayload & { role: string };
      next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "JWT Expired"
        );
      }
      next(error);

    }
  });
};

export default auth;
