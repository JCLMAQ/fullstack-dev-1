import { Injectable } from '@nestjs/common';

@Injectable()
export class TimeUtilService {

  /*
    *   Delay utilities
    */

// Delay between the present moment and the past date time
async timeStampDelay(dateStampToTest: Date, delayMilliSecond: number): Promise<boolean> {
  const tooShort = (new Date().getTime() - dateStampToTest.getTime()) < delayMilliSecond;
  return tooShort;
}

// Delay between two date time
async twoTimeStampsDelay(dateStampOne: Date, dateStampTwo: Date, delayMilliSecond: number): Promise<boolean> {
  const tooShort = (dateStampOne.getTime() - dateStampTwo.getTime()) < delayMilliSecond;
  return tooShort;
}

// New date according an initial date and a delay between the two
async dateLessDelay(dateInit: Date, delayMilliSecond: number): Promise<Date>{
  const newDate = new Date(dateInit.getTime()- delayMilliSecond);
  return newDate
}

}
