const fs: any = require('fs')
const path: any = require('path')

const Cryptr = require('cryptr')

require('dotenv').config({ path: __dirname + '/.env' })

const setRequiredVariable = (variableName: string) => {
  if (process.env[variableName]) {
    return process.env[variableName];
  }
  throw new Error(`ENV-variable missing: ${variableName}`);
}

const cryptr = new Cryptr(setRequiredVariable('ENCRYPT_KEY'));


const encryptData = (variableName: string) => {
  return cryptr.encrypt(variableName)
}

const decryptData = (variableName: string) => {
  return cryptr.encrypt(variableName)
}

export {
  setRequiredVariable,
  encryptData,
  decryptData
}