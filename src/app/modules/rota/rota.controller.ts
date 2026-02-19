import { RequestHandler } from "express";
;
import httpStatus from "http-status";


import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { RotaServices } from "./rota.service";


const getAllRota: RequestHandler = catchAsync(async (req, res) => {
  const result = await RotaServices.getAllRotaFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Rotas retrived succesfully",
    data: result,
  });
});


const getSingleRota = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await RotaServices.getSingleRotaFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Rota is retrieved succesfully",
    data: result,
  });
});


const updateRota = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await RotaServices.updateRotaIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Rota is updated succesfully",
    data: result,
  });
});

const createRota = catchAsync(async (req, res) => {
  
  const result = await RotaServices.createRotaIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Rota Created succesfully",
    data: result,
  });
});

const deleteRota = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await RotaServices.deleteRotaFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Rota deleted successfully",
    data: result,
  });
});



const copyRota = catchAsync(async (req, res) => {
  const result = await RotaServices.copyRotaIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shifts copied successfully",
    data: result,
  });
});

const bulkAssignRota = catchAsync(async (req, res) => {
  const result = await RotaServices.bulkAssignRotaIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Bulk assign successful",
    data: result,
  });
});



export const RotaControllers = {
    getAllRota,
    getSingleRota,
    updateRota,
    createRota,
    deleteRota,
    bulkAssignRota,
    copyRota
};

