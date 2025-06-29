import { dbAll } from '../utils/database';

export const doctorDailySchedule = async (_: any, { doctorId, date }: { doctorId: string, date: string }) => {
  const schedule = await dbAll(
    'SELECT * FROM v_doctor_daily_schedule WHERE doctor_id = ? AND activity_date = ? ORDER BY start_time',
    [doctorId, date]
  );
  
  return schedule.map((item: any) => ({
    doctorId: item.doctor_id,
    doctorName: item.doctor_name,
    activityDate: item.activity_date,
    startTime: item.start_time,
    endTime: item.end_time,
    roomName: item.room_name,
    roomNumber: item.room_number,
    locationName: item.location_name,
    status: item.status,
    notes: item.notes
  }));
};
