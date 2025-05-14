import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getConnectedModels } from '@/lib/dbConnect';
import bcrypt from 'bcryptjs';

// GET /api/users/[id] - Get a specific user
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get models after ensuring DB connection
    const { User } = await getConnectedModels();
    
    // Explicitly await the params object as recommended in the error message
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update a specific user
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get models after ensuring DB connection
    const { User } = await getConnectedModels();
    
    // Explicitly await the params object as recommended in the error message
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    const body = await req.json();
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    // If password is being updated, hash it
    if (body.password) {
      const salt = await bcrypt.genSalt(10);
      body.password = await bcrypt.hash(body.password, salt);
    }
    
    // Find user and update
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        ...body,
        // Ensure the new fields are properly handled
        ...(body.role && { role: body.role }),
        ...(body.department && { department: body.department }),
        ...(body.isAvailableForAssignment !== undefined && { isAvailableForAssignment: body.isAvailableForAssignment })
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a specific user
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get models after ensuring DB connection
    const { User } = await getConnectedModels();
    
    // Explicitly await the params object as recommended in the error message
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    const deletedUser = await User.findByIdAndDelete(id);
    
    if (!deletedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
