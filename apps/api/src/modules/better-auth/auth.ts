import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
// import {
//   handleOrderPaid,
//   handleSubscriptionCanceled,
//   handleSubscriptionRevoked,
// } from './payment.server';

/*
 * prisma
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/*
 * polar
 */
// import {
//   polar,
//   checkout,
//   portal,
//   usage,
//   webhooks,
// } from '@polar-sh/better-auth';
// import { Polar } from '@polar-sh/sdk';

/*
 * swagger
 */
/*
 * api docs
 */
import { openAPI } from 'better-auth/plugins';

/*
 *bearer
 * auth
 */
import { bearer } from 'better-auth/plugins';

// const polarClient = new Polar({
//   accessToken: process.env.POLAR_ACCESS_TOKEN,
//   // Use 'sandbox' if you're using the Polar Sandbox environment
//   // Remember that access tokens, products, etc. are completely separated between environments.
//   // Access tokens obtained in Production are for instance not usable in the Sandbox environment.
//   server: 'sandbox',
// });

/*
 * better-auth
 */
export const auth = betterAuth({
  /*
   * database
   */
  trustedOrigins: [
    process.env.APP_BASE_URL as string,
    process.env.API_BASE_URL as string,
  ],
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  /*
   * email and password
   */
  emailAndPassword: {
    enabled: true,
  },

  /*
   * social providers
   * google
   */
  socialProviders: {
    google: {
      clientId: process.env.BETTER_AUTH_GOOGLE_ID!,
      clientSecret: process.env.BETTER_AUTH_GOOGLE_SECRET!,
    },
  },

  /*
   * additional fields
   */
  user: {
    additionalFields: {
      role: { type: 'string', required: false, default: null, nullable: true },
      phone: { type: 'string', required: false, default: null, nullable: true },
      phoneVerified: {
        type: 'boolean',
        required: false,
        default: false,
      },
      profileCompleted: {
        type: 'boolean',
        required: false,
        default: false,
      },
      subscriptionId: {
        type: 'string',
        required: false,
        default: null,
        nullable: true,
      },
    },
  },

  /*
   * session and cookies
   */
  advanced: {
    cookiePrefix: 'leostack',
  },
  session: {
    // expiresIn: 60 * 60 * 8, // 8 hours
    expiresIn: 60,
  },
  /*
   * plugins
   */
  plugins: [
    bearer(),
    openAPI(),
    // polar({
    //   client: polarClient,
    //   // createCustomerOnSignUp: true,
    //   use: [
    //     checkout({
    //       products: [
    //         {
    //           productId: 'd6fd3bbd-8fae-4302-b4a6-240497c03626',
    //           slug: 'benificial',
    //         },
    //       ],
    //       successUrl: '/api/payments/success?checkout_id={CHECKOUT_ID}',
    //       authenticatedUsersOnly: true,
    //     }),
    //     portal(),
    //     usage(),
    //     webhooks({
    //       secret: process.env.POLAR_WEBHOOK_SECRET!,
    //       onOrderPaid: handleOrderPaid,
    //       onSubscriptionCanceled: handleSubscriptionCanceled,
    //       onSubscriptionRevoked: handleSubscriptionRevoked,
    //     }),
    //   ],
    // }),
  ],
});

// session
export const getSession = async (request: Request) => {
  const session = await auth.api.getSession(request);
  return session;
};
