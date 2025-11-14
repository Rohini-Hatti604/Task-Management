import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ""
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sections: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section'
    }]
}, { 
    timestamps: true 
});


projectSchema.index({ members: 1 });
projectSchema.index({ createdBy: 1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;

