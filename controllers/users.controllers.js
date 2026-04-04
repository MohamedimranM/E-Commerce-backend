
import User from '../models/user.model.js';

// Get all users
export const getUsers = async (req, res, next) => {
	try {
		const users = await User.find().select('-password -confirmPassword');
		res.status(200).json({ success: true, users });
	} catch (error) {
		next(error);
	}
};

// Get a particular user by ID
export const getUserById = async (req, res, next) => {
	try {
		const { id } = req.params;
		const user = await User.findById(id).select('-password -confirmPassword');
		if (!user) {
			const err = new Error('User not found.');
			err.statusCode = 404;
			return next(err);
		}
		res.status(200).json({ success: true, user });
	} catch (error) {
		next(error);
	}
};

// Update user by ID
export const updateUser = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { name, email } = req.body;
		const user = await User.findById(id);
		if (!user) {
			const err = new Error('User not found.');
			err.statusCode = 404;
			return next(err);
		}
		if (name) user.name = name;
		if (email) user.email = email;
		await user.save();
		const updatedUser = await User.findById(id).select('-password -confirmPassword');
		res.status(200).json({ success: true, user: updatedUser });
	} catch (error) {
		next(error);
	}
};

// Delete user by ID
export const deleteUser = async (req, res, next) => {
	try {
		const { id } = req.params;
		const user = await User.findByIdAndDelete(id);
		if (!user) {
			const err = new Error('User not found.');
			err.statusCode = 404;
			return next(err);
		}
		res.status(200).json({ success: true, message: 'User deleted successfully.' });
	} catch (error) {
		next(error);
	}
};
