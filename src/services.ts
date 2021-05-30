export const services = {}

export type Services = typeof services

export type Depends<Service> = Pick<
    Services,
    keyof Services extends infer Key
        ? Key extends keyof Services
            ? Services[Key] extends Service
                ? Key
                : never
            : never
        : never
>
