const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("crypto");
const { promisify } = require("util");
const { transport, makeANiceEmail } = require("../mail");

const Mutations = {
  async createItem(parent, args, ctx, info) {
    // TODO: Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error("You must be logged in to do that!");
    }

    const item = await ctx.db.mutation.createItem(
      {
        data: {
          // Creating relationship between the Item and the User
          user: {
            connect: {
              id: ctx.request.userId
            }
          },
          ...args
        }
      },
      info
    );
    console.log(item);

    return item;
  },
  // Edit Items
  updateItem(parent, args, ctx, info) {
    // first take a copy of the updates
    const updates = { ...args };
    // remove the ID from the updates
    delete updates.id;
    // run the update method
    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id
        }
      },
      info
    );
  },
  // Delete Items
  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    // find the Item
    const item = await ctx.db.query.item({ where }, `{id title}`);
    // check if they own that item, or have the permissions
    // TODO
    // Delete it
    return ctx.db.mutation.deleteItem({ where }, info);
  },
  async signup(parent, args, ctx, info) {
    //  lowercase their email
    args.email = args.email.toLowerCase();
    //  hash their password
    const password = await bcrypt.hash(args.password, 10);
    //  create the user in the database
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ["USER"] }
        }
      },
      info
    );
    //  create the JWT for user
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    //  We set the jwt as a cookie on the response
    ctx.response.cookie("token", token, {
      httpOnly: true,
      // 1 year cookie
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
    // we return the user to the browser
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {
    // 1. check if there is a user with that email
    const user = await ctx.db.query.user({ where: { email: email } });
    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    // 2. check if their password is correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error("Invalid Password!");
    }
    // 3. generate the JWT Token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // 4. Set the cookie with the token
    ctx.response.cookie("token", token),
      {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 365
      };
    // 5. Return the user
    return user;
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie("token");
    return { message: "Goodbye!" };
  },
  async requestReset(parent, args, ctx, info) {
    // 1. Check if this is a real User
    const user = await ctx.db.query.user({ where: { email: args.email } });
    if (!user) {
      throw new Error(`No such user found for email ${args.email}`);
    }
    // 2. set a reset token and expiry
    const randomBytesPromiseified = promisify(randomBytes);
    const resetToken = (await randomBytesPromiseified(20)).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
    const res = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry }
    });
    // should not console log reset tokens even in production as it
    // may be stored in server logs, treat it as a password.
    // console.log(res);
    // 3. Email them that reset token
    const mailRes = await transport.sendMail({
      from: "Cain@cain.com",
      to: user.email,
      subject: "Your Password Reset Token",
      html: makeANiceEmail(
        `Your Password Reset Token is Here! \n\n <a href="${
          process.env.FRONTEND_URL
        }/reset?resetToken=${resetToken}">Click Here to Reset</a>`
      )
    });
    // 4. Return the message
    return { message: "Thanks" };
  },
  async resetPassword(parent, args, ctx, info) {
    // 1. check if the password match
    if (args.password !== args.confirmPassword) {
      throw new Error("Passwords don't match!");
    }
    // 2. check if its a legit resset tokane
    // 3. check if its expired
    const [user] = await ctx.db.query.users({
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000
      }
    });
    if (!user) {
      throw new Error("This token is either invalid or expired!");
    }
    // 4. hash their new password
    const password = await bcrypt.hash(args.password, 10);
    // 5. Save the new password to the user and remove old resetToken fields
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null
      }
    });
    // 6. Generate JWT
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    // 7. Set the JWT cookie
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
    // 8. return the new User
    return updatedUser;
  }
};

module.exports = Mutations;
