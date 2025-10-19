import mongoose from "mongoose";

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO as string)       
        console.log("mongodb connected successfully ✨");
    } catch (error) {
        console.error(error);
        throw new Error("Failed to connect the mongodb")
    }
}

export default connect;