import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as xapix from "@xapix-io/infra";
import configs from "./config";

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

const appLabels = { app: "reqres" };

const image = `xapixio/reqres:${version}`

const config = configs.prefixed('xapix-reqres')

const memoryMB = config.requireNumber('require-memory')

const issuer = stringOutput(infra.requireOutput('prodIssuer'));

new k8s.apps.v1.Deployment("reqres", {
    metadata: {
        namespace
    },
    spec: {
        selector: { matchLabels: appLabels },
        replicas: config.getNumberWithDefault('replicas'),
        template: {
            metadata: { labels: appLabels },
            spec: {
                containers: [{
                    name: "reqres",
                    image,
                    livenessProbe: {
                        httpGet: {
                            path: "/",
                            port: 5000
                        },
                        initialDelaySeconds: 5,
                        periodSeconds: 20
                    },
                    ports: [{ containerPort: 5000 }],
                    resources: {
                        requests: {
                            memory: memoryMB + 'Mi',
                            cpu: config.require('require-cpu')
                        },
                        limits: {
                            memory: Math.round(memoryMB * 1.2) + 'Mi',
                            cpu: config.require('require-cpu')
                        }
                    },
                    securityContext: {
                        capabilities: {
                            drop: ['ALL']
                        },
                        readOnlyRootFilesystem: true
                    },
                    volumeMounts: [
                        {
                            name: 'tmp',
                            mountPath: '/tmp'
                        }
                    ]
                }],
                restartPolicy: 'Always',
                volumes: [
                    {
                        name: 'tmp',
                        emptyDir: {}
                    }
                ],
                imagePullSecrets: [
                    {
                        name: dockerSecret
                    }
                ]
            }
        }
    }
}, { provider });

const externalService = new k8s.core.v1.Service("reqres-external", {
    metadata: {
        namespace
    },
    spec: {
        type: 'ClusterIP',
        ports: [
            {
                name: 'http',
                port: 80,
                protocol: 'TCP',
                targetPort: 5000,
            }
        ],
        selector: appLabels
    }
}, { provider })

const mainHost = stringOutput(infra.requireOutput('baseDomain')).apply(x => 'reqres.' + x)

new k8s.networking.v1beta1.Ingress('reqres', {
    metadata: {
        namespace,
        annotations: {
            'kubernetes.io/ingress.class': "nginx",
            'nginx.ingress.kubernetes.io/ssl-redirect': "false",
            'cert-manager.io/cluster-issuer': issuer,
        }
    },
    spec: {
        tls: [{
            hosts: [mainHost],
            secretName: 'reqres-external-tls'
        }],
        rules: [{
            host: mainHost,
            http: {
                paths: [{
                    path: '/',
                    backend: {
                        serviceName: externalService.metadata.name,
                        servicePort: 80
                    }
                }]
            }
        }]
    }
}, { provider })


const mobilityHost = infra.requireOutput('baseDomain').apply(x => 'mobility.' + x);

new k8s.networking.v1beta1.Ingress('reqres-mobility', {
    metadata: {
        namespace,
        annotations: {
            'kubernetes.io/ingress.class': "nginx",
            'nginx.ingress.kubernetes.io/ssl-redirect': "false",
            'cert-manager.io/cluster-issuer': issuer,
            'nginx.ingress.kubernetes.io/rewrite-target': '/$1'
        }
    },
    spec: {
        tls: [{
            hosts: [mobilityHost],
            secretName: 'mobility-api-tls'
        }],
        rules: [{
            host: mobilityHost,
            http: {
                paths: [{
                    path: '/samples/(.+)',
                    backend: {
                        serviceName: externalService.metadata.name,
                        servicePort: 80
                    }
                }]
            }
        }]
    }
}, {provider})
