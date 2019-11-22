import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as xapix from "@xapix-io/infra";
import configs from "../config";

export default function({
    provider,
    version,
    dockerSecret,
    issuer,
    namespace,
    domain}:
    {
        provider: k8s.Provider,
        version: string,
        issuer: pulumi.Output<string>,
        namespace: pulumi.Output<string>,
        domain: pulumi.Output<string>,
        dockerSecret: pulumi.Output<string>,
    }) {

    const stack = pulumi.getStack();
    const appLabels = { app: "reqres" };

    const image = `docker.pkg.github.com/xapix-io/reqres/reqres:${version}`

    const config = configs.prefixed('xapix-reqres')

    const memoryMB = config.requireNumber('require-memory')

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

    const host = domain.apply(x => 'reqres.' + x)

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
                hosts: [host],
                secretName: 'reqres-external-tls'
            }],
            rules: [{
                host,
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
}
