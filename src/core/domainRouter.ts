import { GroundRequest, GroundResponse } from "../api/contract";
import { ground as groundClinical } from "./engine";
import { groundFinance } from "./finance";
import { groundLegal } from "./legal";

export const groundByDomain = (req: GroundRequest): GroundResponse => {
  if (req.domain === "finance") {
    return groundFinance(req);
  }
  if (req.domain === "legal") {
    return groundLegal(req);
  }

  return groundClinical(req);
};
