
import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

if (admin.apps.length === 0) admin.initializeApp();

import { createAndDispatchMission } from "./missions/createMission";
import { lockMission, completeMissionWithQR } from "./bookings";
import { completeRegistration } from "./auth";

export { 
    createAndDispatchMission,
    lockMission,
    completeMissionWithQR,
    completeRegistration
};

export const createBooking = createAndDispatchMission;
