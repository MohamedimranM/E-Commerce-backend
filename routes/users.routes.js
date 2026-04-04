import { Router } from "express";
import authorize from '../middleware/authorize.js';
import restrictTo from '../middleware/restrictTo.js';
import { deleteUser, getUserById, getUsers, updateUser } from "../controllers/users.controllers.js";

const userRouter = Router();

// Define your user routes here

userRouter.get('/', authorize, restrictTo('admin'), getUsers);
userRouter.get('/:id', authorize, getUserById);
userRouter.put('/:id', authorize, updateUser);
userRouter.delete('/:id', authorize, restrictTo('admin'), deleteUser);

export default userRouter;
