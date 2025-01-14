import { Node } from "@the-sage-group/awyes-node";
import { waitUntilCertificateValidated } from "@aws-sdk/client-acm";
import { clients } from "../clients";

export const createCertificates = {
  node: {
    version: 1,
    context: "aws",
    name: "create_certificates",
    description:
      "Creates ACM certificates for the specified domain and subdomains",
  },
  async handler({ acm, route53 }: typeof clients, params: Node["parameters"]) {
    const { domainName, subDomains } = params as {
      domainName: string;
      subDomains: string[];
    };

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

    return {
      certificateArn: certificate?.CertificateArn!,
      hostedZoneId: hostedZone.HostedZoneId!,
    };
  },
};
