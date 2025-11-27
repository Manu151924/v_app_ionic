import { environment } from 'src/environments/environment';

const CORE_BASE_URL = environment.coreApiBaseUrl;
const VAPP_BASE_URL = environment.vappApiBaseUrl;
export const API_ENDPOINTS = {
  LOGIN: {
    SENDOTP: `${CORE_BASE_URL}sendOtpSmsAndWhatsApp`,
    VERIFYOTP: `${CORE_BASE_URL}verifyotp`,
  },
  BOOKING: {
    PANNELONECOUNT: `${VAPP_BASE_URL}getPanelOneCount`,
    PANNELTWOTABLE: `${VAPP_BASE_URL}getPanelTwoTripTableData`,
    PANNELTHREEDATA: `${VAPP_BASE_URL}getPanelThreeData`,
    PANNELFOUR: `${VAPP_BASE_URL}getPanelFourWaybillEditDetails`,
    LOCATIONDROPDOWN: `${VAPP_BASE_URL}getBranchDetails`,
    ASSIGNEDSFXDETAILS:`${VAPP_BASE_URL}getAssignedSfxDetails`,
    ZEROPICKUP:`${VAPP_BASE_URL}getZeroPickupDetails`,
    NOTMANIFISTED: `${VAPP_BASE_URL}getPanelOneNotManifestedDetails`,
    DRAFTWATBILL:`${VAPP_BASE_URL}getPanelOneDraftWaybillDetails`,
    SHEXMODAL:`${VAPP_BASE_URL}getPanelTwoShortExcessDetails`
  },
    VENDOR: {
    DETAILS: `${CORE_BASE_URL}vendor`, 
  },
};
