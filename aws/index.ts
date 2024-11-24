import { getInfra } from "./infra";
import { createRole } from "./role";
import { createLoadBalancer } from "./load";
import { createCertificates } from "./certs";

export function deploy({}) {
  const infra = getInfra();
  const role = createRole({ name: "example-role" });
  const certificates = createCertificates({
    domainName: "example.com",
    subDomains: ["www.example.com"],
  });
  const load = createLoadBalancer({
    name: "example-load-balancer",
    port: 80,
    protocol: "HTTP",
    type: "application",
    scheme: "internet-facing",
    domainName: "example.com",
    infra,
  });
}
