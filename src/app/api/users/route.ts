import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getConnectedModels } from '@/lib/dbConnect';
import bcrypt from 'bcryptjs';

// GET /api/users - Get all users (admin only)
export async function GET(req: NextRequest) {
  try {
    // Get models after ensuring DB connection
    const { User } = await getConnectedModels();
    
    // In a real app, you would check if the user is an admin here
    
    const users = await User.find({}).select('-password');
    
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Register a new user
export async function POST(req: NextRequest) {
  try {
    // Get models after ensuring DB connection
    const { User } = await getConnectedModels();
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(body.password, salt);
    
    // Create new user
    const newUser = new User({
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: body.role || 'user',
      department: body.department || 'Front Desk',
      isAvailableForAssignment: body.isAvailableForAssignment !== undefined ? body.isAvailableForAssignment : true,
    });
    
    await newUser.save();
    
    // Don't return the password
    const userResponse = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      isAvailableForAssignment: newUser.isAvailableForAssignment,
      createdAt: newUser.createdAt,
    };
    
    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
