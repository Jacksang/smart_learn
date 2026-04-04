const jwt = require('jsonwebtoken');
const {
  findByEmail,
  findById,
  createUser,
  comparePassword,
  touchLastActive,
  toPublicProfile,
} = require('./repository');

function signToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'smartlearn-dev-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, age, gradeLevel, subjects, learningStyle, goals } = req.body;

    const normalizedEmail = email?.toLowerCase();
    const existingUser = await findByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    const user = await createUser({
      name,
      email: normalizedEmail,
      password,
      age,
      gradeLevel,
      subjects,
      learningStyle,
      goals,
    });

    const token = signToken(user.id);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: toPublicProfile(user),
    });
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await findByEmail(email.toLowerCase(), { includePassword: true });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    await touchLastActive(user.id);

    const token = signToken(user.id);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: toPublicProfile(user),
    });
  } catch (error) {
    return next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user: toPublicProfile(user) });
  } catch (error) {
    return next(error);
  }
};
