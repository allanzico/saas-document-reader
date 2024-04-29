import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { TRPCError, initTRPC } from "@trpc/server/unstable-core-do-not-import"

const trpc = initTRPC.create()
const middleware = trpc.middleware
const isAuth = middleware(async ({ctx, next}) => {
    const {getUser} = getKindeServerSession()
    const user = await getUser()
    if (!user || !user.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    return next({
        ctx: {
            userId: user.id,
            user,
        }
    })
})

export const router = trpc.router
export const procedure = trpc.procedure
export const privateProcedure = trpc.procedure.use(isAuth)