import mongoose from "mongoose";

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO as string)       
    } catch (error) {
        console.error(error);
        throw new Error("Failed to connect the mongodb")
    }
}

export default connect;