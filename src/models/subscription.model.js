import mongoose, {Schema} from "mongoose";

const SubscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, //one who subscribed
        ref: "User",
        required: true
    },
    channel: {
        type: Schema.Types.ObjectId, //one to whom subscribed
        ref: "User",
        required: true
    }
});

export const Subscription = mongoose.model("Subscription", SubscriptionSchema);