import mongoose from "mongoose";

const userSchema = mongoose.Schema({

    name: {
        type: String,
        required: true
    }, 
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    emailOtp: {
        type: String,
        default: null
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailOtpExpiration: {
        type: Date,
        default: null
    },
    passwordResetToken: {
    type: String,
    default: null
    },
    passwordResetTokenExpiration: {
        type: Date,
        default: null
    },
    refreshToken: {
            type: String
    }
}, 
{
    timestamps: true
});

const User = mongoose.model("User", userSchema);
export default User;