export const USER_ROLE = {
  user: "user",
  admin: "admin",
  company: "company",
  companyAdmin: "companyAdmin",
  creator: "creator",
  director: "director",
  employee: "employee",
  attendance:"attendance"
} as const;

export const UserStatus = ["block", "active"];

export const UserSearchableFields = ["email", "name", "role","title","firstName","lastName"];
