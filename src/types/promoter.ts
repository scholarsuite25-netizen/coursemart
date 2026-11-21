/**
 * Types for the Executive Promoter Profile, Availability Calendar, and Facilitator Booking System.
 */

export type CalendarEngagementType = 'booked' | 'available' | 'tentative';

export interface CalendarEngagement {
  id: string;
  date: string; // ISO format: YYYY-MM-DD
  title: string;
  type: CalendarEngagementType;
  locationType?: 'physical' | 'virtual' | 'hybrid';
  organization?: string;
  timeSlot?: string;
}

export type FacilitatorLocationType = 'Physical' | 'Virtual' | 'Hybrid';

export type FacilitatorScope =
  | 'Keynote'
  | 'Corporate Masterclass'
  | 'Workshop'
  | 'Executive Panel'
  | 'Bootcamp';

export interface FacilitatorBookingInput {
  name: string;
  organization: string;
  email: string;
  phone: string;
  phoneWhatsApp?: string; // Compatibility alias
  eventTitle: string;
  date: string; // ISO format: YYYY-MM-DD
  venue: string;
  locationType: FacilitatorLocationType;
  scope: FacilitatorScope;
  audienceSize: string | number;
  objectives: string;
}

export interface FacilitatorBooking extends FacilitatorBookingInput {
  id: string;
  reference: string;
  referenceCode?: string; // Compatibility alias for reference
  createdAt: string;
  status: 'pending' | 'accepted' | 'confirmed' | 'declined';
  whatsAppDispatchUrl?: string;
}
