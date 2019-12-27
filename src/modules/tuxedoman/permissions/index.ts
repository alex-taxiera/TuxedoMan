import {
  createGeneric,
  admin as baseAdmin,
  owner as baseOwner,
  vip as baseVip
} from "eris-boiler/permissions"
import { TuxedoMan } from ".."


export const admin = createGeneric<TuxedoMan>(baseAdmin)
export const owner = createGeneric<TuxedoMan>(baseOwner)
export const vip = createGeneric<TuxedoMan>(baseVip)
