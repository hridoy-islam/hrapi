// import jwt, { JwtPayload, Secret } from 'jsonwebtoken';

// const createToken = (
//   payload: Record<string, unknown>,
//   secret: Secret,
//   expireTime: string
// ): string => {
//   return jwt.sign(payload, secret, {
//     expiresIn: expireTime,
//   });
// };

// const createResetToken = (
//   payload: any,
//   secret: Secret,
//   expireTime: string
// ): string => {
//   return jwt.sign(payload, secret, {
//     algorithm: 'HS256',
//     expiresIn: expireTime,
//   });
// };

// const verifyToken = (token: string, secret: Secret): JwtPayload => {
//   return jwt.verify(token, secret) as JwtPayload;
// };



// export const jwtHelpers = {
//   createToken,
//   verifyToken,
//   createResetToken
// };



import jwt, { JwtPayload } from 'jsonwebtoken'

const createToken = (
  jwtPayload: JwtPayload,
  secret: string,
  options: {
    expiresIn: string
  },
) => {
  return jwt.sign(jwtPayload, secret, options)
}

const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret)
}

export const jwtHelpers = {
  createToken,
  verifyToken,
}
