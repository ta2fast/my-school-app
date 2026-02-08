import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 生年月日から日本の学年を計算する
 * 日本の学年度は4月1日に始まり、翌年3月31日に終わる
 */
export function getJapaneseGrade(birthDate?: string): string {
  if (!birthDate) return '未設定';

  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return '未設定';

  const today = new Date();
  // 現在の学年度の開始年 (4月1日基準)
  let currentFiscalYear = today.getFullYear();
  if (today.getMonth() < 3) { // 0-2 (1月, 2月, 3月)
    currentFiscalYear--;
  }

  // 生徒が小学校1年生になる年 (4月2日〜翌年4月1日生まれが同じ学年)
  // 6歳になる年の4月に小1
  // 例: 2015年4月2日〜2016年4月1日生まれは、2022年4月に小1
  let birthYear = birth.getFullYear();
  let birthMonth = birth.getMonth(); // 0-11
  let birthDay = birth.getDate();

  // 学年の区切り（4月2日）
  // 4月1日生まれまでは前の学年、4月2日生まれからは次の学年
  let entranceYear = birthYear + 6;
  if (birthMonth < 3 || (birthMonth === 3 && birthDay === 1)) {
    // 早生まれ (1/1 〜 4/1)
    // 既に 1年引かれている必要はないが、計算上 entranceYear が決まる
  } else {
    entranceYear++;
  }

  const gradeDiff = currentFiscalYear - entranceYear;

  if (gradeDiff < 0) return '未就学';
  if (gradeDiff < 6) return `小${gradeDiff + 1}`;
  if (gradeDiff < 9) return `中${gradeDiff - 6 + 1}`;
  if (gradeDiff < 12) return `高${gradeDiff - 9 + 1}`;

  return '卒業生';
}

/**
 * 西暦を和暦に変換する (簡易版: 年単位)
 */
export function getJapaneseEra(year: number): string {
  if (year >= 2019) return `令和${year - 2019 + 1}年`;
  if (year >= 1989) return `平成${year - 1989 + 1}年`;
  if (year >= 1926) return `昭和${year - 1926 + 1}年`;
  if (year >= 1912) return `大正${year - 1912 + 1}年`;
  return '';
}
