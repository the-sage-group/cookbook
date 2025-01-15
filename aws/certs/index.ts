import { FieldDescriptorProto_Type, Value } from "@the-sage-group/awyes-node";
import { waitUntilCertificateValidated } from "@aws-sdk/client-acm";
import { HandlerClients } from "../clients";

export const createCertificates = {
  node: {
    version: 1,
    context: "aws",
    name: "create_certificates",
    description:
      "Creates ACM certificates for the specified domain and subdomains",
    parameters: [
      { name: "domainName", type: FieldDescriptorProto_Type.TYPE_STRING },
      { name: "subDomains", type: FieldDescriptorProto_Type.TYPE_STRING },
    ],
    returns: [
      { name: "certificateArn", type: FieldDescriptorProto_Type.TYPE_STRING },
      { name: "hostedZoneId", type: FieldDescriptorProto_Type.TYPE_STRING },
    ],
  },
  async handler(
    clients: HandlerClients,
    params: { domainName: string; subDomains: string[] }
  ) {
    const { acm, route53 } = clients;
    const { domainName, subDomains } = params;

    await acm.requestCertificate({
      DomainName: domainName,
      ValidationMethod: "DNS",
      SubjectAlternativeNames: subDomains,
    });

    await new Promise((r) => setTimeout(r, 15 * 1000));

    const certificates = await acm.listCertificates({});
    const certificate = certificates.CertificateSummaryList?.find(
      (cert) => cert.DomainName === domainName
    );

    const certificateDetails = await acm.describeCertificate({
      CertificateArn: certificate?.CertificateArn,
    });

    const hostedZone = await route53.listHostedZonesByName({
      DNSName: domainName,
    });

    await route53.changeResourceRecordSets({
      ChangeBatch: {
        Changes: certificateDetails.Certificate?.DomainValidationOptions?.map(
          (option) => ({
            Action: "UPSERT",
            ResourceRecordSet: {
              Name: option.ResourceRecord?.Name,
              Type: option.ResourceRecord?.Type,
              TTL: 300,
              ResourceRecords: [{ Value: option.ResourceRecord?.Value }],
            },
          })
        ),
      },
      HostedZoneId: hostedZone.HostedZoneId,
    });

    await waitUntilCertificateValidated(
      { client: acm, maxWaitTime: 600 },
      { CertificateArn: certificate?.CertificateArn }
    );

    if (!certificate?.CertificateArn || !hostedZone.HostedZoneId) {
      throw new Error(
        "Failed to create certificate: Missing required return values"
      );
    }

    return {
      certificateArn: certificate.CertificateArn,
      hostedZoneId: hostedZone.HostedZoneId,
    };
  },
};
