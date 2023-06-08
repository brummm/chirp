import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
    });

    const uniqueAuthorIds = new Set(posts.map((post) => post.authorId));

    const users = (
      await clerkClient.users.getUserList({
        userId: Array.from(uniqueAuthorIds),
      })
    ).map(({ profileImageUrl, firstName, username, id }) => ({
      profileImageUrl,
      firstName,
      username,
      id,
    }));
    return posts.map((post) => {
      const author = users.find((user) => user.id === post.authorId);
      if (!author)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Author not found",
        });

      return {
        ...post,
        author,
      };
    });
  }),
});
