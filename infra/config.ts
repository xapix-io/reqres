import { Configuration, PropType } from "@xapix-io/infra"

const config = new Configuration({
    'xapix-reqres': {
        'require-memory': {
            required: true,
            type: PropType.NUMBER,
            description: 'How many megabytes of memory should be reserved for each Reqres Pod'
        },
        'require-cpu': {
            required: true,
            type: PropType.STRING,
            description: 'How many CPU units should be reserved for each Reqres Pod'
        },
        'replicas': {
            type: PropType.NUMBER,
            description: 'Number of Reqres instances to deploy',
            default: 1
        },
    },
})

export default config

if (require.main === module) {
    config.generateDoc('docs/config.md')
}
