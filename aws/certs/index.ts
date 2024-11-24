import * as awyes from "@the-sage-group/awyes";

import * as ACM from "@aws-sdk/client-acm";
import * as Route53 from "@aws-sdk/client-route-53";

const acm = new ACM.ACM({ region: "us-west-2" });
const route53 = new Route53.Route53({ region: "us-west-2" });

export function createCertificates({
  domainName,
  subDomains,
}: {
  domainName: string;
  subDomains: string[];
}) {
  return new awyes.Flow()
    .add("requestCertficate", () =>
      acm.requestCertificate({
        DomainName: domainName,
        ValidationMethod: "DNS",
        SubjectAlternativeNames: subDomains,
      })
    )
    .add("sleep", () => new Promise((r) => setTimeout(r, 15 * 1000)))
    .add("listCertificates", () => acm.listCertificates({}))
    .add("filterCertificate", async ({ listCertificates }) => {
      const certificates = await listCertificates;
      return certificates.CertificateSummaryList?.find(
        (cert) => cert.DomainName === domainName
      );
    })
    .add("describeCertificate", async (context) => {
      const certificate = await context.filterCertificate;
      return acm.describeCertificate({
        CertificateArn: certificate?.CertificateArn,
      });
    })
    .add("listHostedZonesByName", () =>
      route53.listHostedZonesByName({ DNSName: domainName })
    )
    .add("changeResourceRecordSets", async (context) => {
      const response = await context.describeCertificate;
      const hostedZone = await context.listHostedZonesByName;

      return route53.changeResourceRecordSets({
        ChangeBatch: {
          Changes: response.Certificate?.DomainValidationOptions?.map(
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
    })
    .add("waitForCertificateValidation", async (context) => {
      const certificate = await context.filterCertificate;
      await ACM.waitUntilCertificateValidated(
        { client: acm, maxWaitTime: 600 },
        { CertificateArn: certificate?.CertificateArn }
      );
    });
}
