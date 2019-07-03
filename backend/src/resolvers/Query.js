const { forwardTo } = require("prisma-binding");

const Query = {
  items: forwardTo("db"),
  item: forwardTo("db")

  // # If query is exactly the same both on prisma
  // and on query no custom logic you can just
  // forward query from yoga to prisma not necessary
  // to write all of this code.

  // async items(parent, args, ctx, info) {
  //   console.log("Getting Itemsss!!!");
  //   const items = await ctx.db.query.items();
  //   return items;
  // }
};

module.exports = Query;
