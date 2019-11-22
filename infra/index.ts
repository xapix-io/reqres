import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as xapix from "@xapix-io/infra";

import reqres from './components/reqres';

const version = xapix.env.req('VERSION')
const stack = pulumi.getStack();

const infra = new pulumi.StackReference(`xapix/infra/${stack}`);

const kubeconfig = infra.requireOutput("kubeconfig");
const dockerSecret = infra.requireOutput("xapixDocker");

const provider = new k8s.Provider("k8s", { kubeconfig });

function stringOutput(o: pulumi.Output<any>): pulumi.Output<string> {
    return o.apply((v: any) => v as string)
}

const namespace = stringOutput(infra.requireOutput('namespace'))

reqres({
    version,
    provider,
    namespace,
    dockerSecret: stringOutput(dockerSecret),
    issuer: stringOutput(infra.requireOutput('prodIssuer')),
    domain: stringOutput(infra.requireOutput('baseDomain'))
})
