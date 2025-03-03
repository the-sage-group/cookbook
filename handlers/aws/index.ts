import { getInfra } from "./infra";
import { createRole } from "./role";
import { createCertificates } from "./certs";

export default [createCertificates, getInfra, createRole];
