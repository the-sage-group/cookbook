import { getInfra } from "./infra";
import { createRole } from "./role";
import { createCertificates } from "./certs";

export const nodes = {
  createCertificates,
  getInfra,
  createRole,
};
