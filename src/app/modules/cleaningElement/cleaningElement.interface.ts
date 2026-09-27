import { Types } from "mongoose";

// One row of an area's checklist: what to clean and the standard it must meet
export interface TCleaningElement {
  companyId: Types.ObjectId;
  areaId: Types.ObjectId;
  element: string;
  performanceParameter: string;
}
