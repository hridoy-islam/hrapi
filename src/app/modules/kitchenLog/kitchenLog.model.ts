/* eslint-disable @typescript-eslint/no-explicit-any */
import { Model, Schema, model } from "mongoose";
import {
  TEquipmentTemperature,
  TEquipmentTemperatureLog,
  TItemDeepCleanLog,
  TKitchenApproval,
  TKitchenChecklistItem,
  TKitchenCleaningLog,
  TKitchenDeepCleanLog,
  TKitchenLog,
  TKitchenLogHistory,
  TKitchenReading,
  TProbeCalibrationLog,
} from "./kitchenLog.interface";
import {
  KITCHEN_FREQUENCIES,
  KITCHEN_LOG_STATUSES,
  KITCHEN_MODULE_KEYS,
  KITCHEN_SHIFT_KEYS,
  TKitchenModule,
} from "./kitchenLog.constant";

const KitchenLogHistorySchema = new Schema<TKitchenLogHistory>({
  title: { type: String, required: true },
  action: {
    type: String,
    enum: ["start", "stop", "complete", "create", "update", "approve"],
    required: true,
  },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  date: { type: Date, default: Date.now },
});

// Every module shares one collection. The module is the discriminator key, so
// each module below is its own model with its own fields on top of these.
const KitchenLogSchema = new Schema<TKitchenLog>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    employeeId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    module: {
      type: String,
      enum: KITCHEN_MODULE_KEYS,
      required: true,
    },

    frequency: {
      type: String,
      enum: KITCHEN_FREQUENCIES,
      required: true,
    },

    status: {
      type: String,
      enum: KITCHEN_LOG_STATUSES,
      required: true,
    },

    logDate: {
      type: Date,
      required: true,
    },

    periodKey: {
      type: String,
      required: true,
    },

    startTime: { type: String, trim: true },
    endTime: { type: String, trim: true },
    startedAt: { type: Date },
    stoppedAt: { type: Date },

    durationSeconds: {
      type: Number,
      default: 0,
    },

    // Required on completion, checked by the service
    signatureUrl: { type: String },
    signedAt: { type: Date },
    note: { type: String },
    completedAt: { type: Date },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },

    // Written by the service on every change, never by the request
    logs: {
      type: [KitchenLogHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    discriminatorKey: "module",
  },
);

KitchenLogSchema.index({ companyId: 1, module: 1, logDate: -1 });
KitchenLogSchema.index({ employeeId: 1, logDate: -1 });
// One log per item per period (twice a week items carry a slot in the key)
KitchenLogSchema.index(
  { companyId: 1, module: 1, periodKey: 1 },
  { unique: true },
);

export const KitchenLog = model<TKitchenLog>("KitchenLog", KitchenLogSchema);

// Management sign off. Added to the modules that need approval.
const approvalFields = {
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  approvalSignature: { type: String },
  approvedAt: { type: Date },
  approvalComment: { type: String, trim: true },
};

// ---- Kitchen Cleaning Logs ------------------------------------------------

const ChecklistItemSchema = new Schema<TKitchenChecklistItem>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    checked: { type: Boolean, default: false },
  },
  { _id: false },
);

const ReadingSchema = new Schema<TKitchenReading>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

export const KitchenCleaningLog = KitchenLog.discriminator<TKitchenCleaningLog>(
  "KitchenCleaningLog",
  new Schema<TKitchenCleaningLog>({
    shift: { type: String, enum: KITCHEN_SHIFT_KEYS, required: true },
    checklist: { type: [ChecklistItemSchema], default: [] },
    readings: { type: [ReadingSchema], default: [] },
  }),
  "kitchen_cleaning",
);

// ---- Kitchen Deep Clean ---------------------------------------------------

export const KitchenDeepCleanLog = KitchenLog.discriminator<
  TKitchenDeepCleanLog & TKitchenApproval
>(
  "KitchenDeepCleanLog",
  new Schema<TKitchenDeepCleanLog>({
    area: { type: String, required: true, trim: true },
    ...approvalFields,
  }),
  "kitchen_deep_clean",
);

// ---- Equipment Temperature Record -----------------------------------------

const TemperatureSchema = new Schema<TEquipmentTemperature>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    range: { type: String, default: "" },
    time: { type: String, trim: true },
    temperature: { type: Number },
    outOfRange: { type: Boolean, default: false },
    reportedToManagement: { type: Boolean, default: false },
  },
  { _id: false },
);

export const EquipmentTemperatureLog =
  KitchenLog.discriminator<TEquipmentTemperatureLog>(
    "EquipmentTemperatureLog",
    new Schema<TEquipmentTemperatureLog>({
      area: { type: String, trim: true },
      temperatures: { type: [TemperatureSchema], default: [] },
    }),
    "equipment_temperature",
  );

// ---- Larder / Servery / Mini Kitchen Deep Clean ---------------------------

const itemDeepCleanSchema = () =>
  new Schema<TItemDeepCleanLog>({
    itemKey: { type: String, required: true },
    item: { type: String, required: true, trim: true },
    action: { type: String, trim: true, default: "" },
    itemFrequency: { type: String, trim: true, default: "" },
    ...approvalFields,
  });

export const LarderDeepCleanLog = KitchenLog.discriminator<TItemDeepCleanLog>(
  "LarderDeepCleanLog",
  itemDeepCleanSchema(),
  "larder_deep_clean",
);

export const ServeryDeepCleanLog = KitchenLog.discriminator<TItemDeepCleanLog>(
  "ServeryDeepCleanLog",
  itemDeepCleanSchema(),
  "servery_deep_clean",
);

export const MiniKitchenDeepCleanLog =
  KitchenLog.discriminator<TItemDeepCleanLog>(
    "MiniKitchenDeepCleanLog",
    itemDeepCleanSchema(),
    "mini_kitchen_deep_clean",
  );

// ---- Probe Thermometer Calibration Log ------------------------------------

export const ProbeCalibrationLog =
  KitchenLog.discriminator<TProbeCalibrationLog>(
    "ProbeCalibrationLog",
    new Schema<TProbeCalibrationLog>({
      probeDetails: { type: String, trim: true },
      icedWaterReading: { type: Number },
      boilingWaterReading: { type: Number },
      icedWaterInRange: { type: Boolean },
      boilingWaterInRange: { type: Boolean },
    }),
    "probe_calibration",
  );

// Writes always go through the module's own model, so its fields are kept
// (the base model would strip them as unknown)
export const KITCHEN_LOG_MODELS: Record<TKitchenModule, Model<any>> = {
  kitchen_cleaning: KitchenCleaningLog,
  kitchen_deep_clean: KitchenDeepCleanLog,
  equipment_temperature: EquipmentTemperatureLog,
  larder_deep_clean: LarderDeepCleanLog,
  servery_deep_clean: ServeryDeepCleanLog,
  mini_kitchen_deep_clean: MiniKitchenDeepCleanLog,
  probe_calibration: ProbeCalibrationLog,
};
