import { environment } from 'src/environments/environment';

const CORE_BASE_URL = environment.coreApiBaseUrl;
const VAPP_BASE_URL = environment.vappApiBaseUrl;
const VAPP_DELIVERY_URL = environment.vappApiDeliveryUrl;
export const API_ENDPOINTS = {
  LOGIN: {
    SENDOTP: `${CORE_BASE_URL}sendOtpSmsAndWhatsApp`,
    VERIFYOTP: `${CORE_BASE_URL}verifyotp`,
  },
  VENDOR: {
    DETAILS: `${CORE_BASE_URL}vendor`, 
  },
  BOOKING: {
    LOCATIONDROPDOWN: `${VAPP_BASE_URL}getBranchDetails`,
    PANNELONECOUNT: `${VAPP_BASE_URL}getPanelOneCount`,
    PANNELTWOTABLE: `${VAPP_BASE_URL}getPanelTwoTripTableData`,
    PANNELTHREEDATA: `${VAPP_BASE_URL}getPanelThreeData`,
    PANNELFOUR: `${VAPP_BASE_URL}getPanelFourWaybillEditDetails`,    
    ASSIGNEDSFXDETAILS:`${VAPP_BASE_URL}getAssignedSfxDetails`,
    ZEROPICKUP:`${VAPP_BASE_URL}getZeroPickupDetails`,
    NOTMANIFISTED: `${VAPP_BASE_URL}getPanelOneNotManifestedDetails`,
    DRAFTWATBILL:`${VAPP_BASE_URL}getPanelOneDraftWaybillDetails`,
    SHEXMODAL:`${VAPP_BASE_URL}getPanelTwoShortExcessDetails`
  },

  DELIVERY:{
    LOCATIONDROPDOWN: `${VAPP_BASE_URL}getBranchDetails`,
    PANENELONE: `${VAPP_DELIVERY_URL}getPanelOneCount`,
    PANNELONEOVERLAY:`${VAPP_DELIVERY_URL}getPanelOneInventryDet`,
    PANNELONESECONDOVERLAY:`${VAPP_DELIVERY_URL}getPanelOneInternalDetails`,
    PANNELDELIVERYTWOTABLE:`${VAPP_DELIVERY_URL}getPanelTwoTripAndAbsentDetails`,
    PANNELTHREE:`${VAPP_DELIVERY_URL}getPanelThreeCount`,
    PANEELFOUR:`${VAPP_DELIVERY_URL}getPanelFourDetails`
  }
};
