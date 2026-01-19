// TV 편성표 API 서비스

// 공공데이터포털 API 키 (환경변수 또는 설정에서 가져오기)
const API_KEY = import.meta.env.VITE_DATA_GO_KR_API_KEY || '';

/**
 * 공공데이터포털 방송편성표 API 호출
 * @param {Date} date - 조회할 날짜
 * @param {string} channel - 채널 코드 (선택사항)
 * @returns {Promise} 편성표 데이터
 */
/**
 * 공공데이터포털 직업방송 편성표 API 호출
 * @param {Date} date - 조회할 날짜
 * @returns {Promise} 편성표 데이터
 */
export const fetchScheduleFromDataGoKr = async (date) => {
  const dateStr = formatDateForAPI(date, 'YYYYMMDD');
  
  // 공공데이터포털 직업방송 편성표 API
  // https://www.data.go.kr/data/15069598/openapi.do
  const baseURL = 'https://apis.data.go.kr/B552584/JobTv/getAirList';
  const url = `${baseURL}?serviceKey=${encodeURIComponent(API_KEY)}&airWhatday=${dateStr}&numOfRows=100&pageNo=1`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('API 호출 실패');
    }
    const data = await response.json();
    console.log('공공데이터포털 응답:', data);
    return parseJobTvSchedule(data);
  } catch (error) {
    console.error('공공데이터포털 API 오류:', error);
    throw error;
  }
};

/**
 * KBS 편성표 사이트에서 직접 파싱
 * @param {Date} date - 조회할 날짜
 * @returns {Promise} 편성표 데이터
 */
export const fetchScheduleFromKBS = async (date) => {
  const dateStr = formatDateForAPI(date, 'YYYYMMDD');
  
  // KBS 편성표 사이트 URL
  const url = `https://schedule.kbs.co.kr/?search_day=${dateStr}`;
  
  try {
    // CORS 문제로 인해 프록시 사용
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error('KBS 편성표 호출 실패');
    }
    
    const data = await response.json();
    const htmlContent = data.contents;
    
    // HTML에서 JSON 데이터 추출
    return parseKBSScheduleFromHTML(htmlContent);
  } catch (error) {
    console.error('KBS 편성표 파싱 오류:', error);
    throw error;
  }
};

/**
 * KBS 편성표 HTML에서 JSON 데이터 추출 및 파싱
 */
const parseKBSScheduleFromHTML = (html) => {
  // HTML에서 JavaScript 변수에 포함된 JSON 데이터 추출
  // $api_schedule_list 변수에서 JSON 데이터 찾기
  const jsonMatch = html.match(/\$api_schedule_list\s*=\s*(\[[\s\S]*?\]);/);
  
  if (!jsonMatch) {
    console.error('KBS 편성표 JSON 데이터를 찾을 수 없습니다');
    return [];
  }
  
  try {
    const scheduleData = JSON.parse(jsonMatch[1]);
    return parseKBSScheduleJSON(scheduleData);
  } catch (error) {
    console.error('KBS 편성표 JSON 파싱 오류:', error);
    return [];
  }
};

/**
 * KBS 편성표 JSON 데이터 파싱
 */
const parseKBSScheduleJSON = (data) => {
  const scheduleMap = new Map();
  
  // 채널 코드 매핑
  const channelMap = {
    '11': 'KBS1',
    '12': 'KBS2',
    '14': 'KBS NEWS D',
    '81': 'KBS 라이프',
    'N91': 'KBS 드라마',
    'N92': 'KBS 조선',
    'N94': 'KBS 월드',
    'N93': 'KBS 스포츠',
    'N96': 'KBS 키즈',
  };
  
  // 데이터가 배열인 경우
  const items = Array.isArray(data) ? data : (data.items || []);
  
  items.forEach(item => {
    const channelCode = item.channel_code || '';
    const channelName = channelMap[channelCode] || item.channel_code_name || `KBS ${channelCode}`;
    
    // 시간 파싱 (예: "19000000" -> "19:00")
    const startTime = item.service_start_time || item.program_planned_start_time || '';
    if (!startTime || startTime.length < 8) return;
    
    const hours = parseInt(startTime.substring(0, 2));
    const minutes = parseInt(startTime.substring(2, 4));
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    
    // 프로그램명
    const programName = item.program_title || item.programming_table_title || '프로그램';
    
    // 방송 시간 (초 단위 -> 분 단위)
    const duration = item.program_planned_duration 
      ? Math.round(item.program_planned_duration / 60) 
      : 60;
    
    // 설명
    const description = item.program_subtitle || item.program_intention || '';
    
    if (!scheduleMap.has(channelName)) {
      scheduleMap.set(channelName, {
        channel: {
          id: scheduleMap.size + 1,
          name: channelName,
          logo: '📺'
        },
        schedule: []
      });
    }
    
    const scheduleItem = scheduleMap.get(channelName);
    
    // 중복 체크
    const exists = scheduleItem.schedule.some(p => 
      p.time === timeStr && p.program === programName
    );
    
    if (!exists) {
      scheduleItem.schedule.push({
        time: timeStr,
        program: programName,
        duration: duration,
        description: description
      });
    }
  });
  
  // 시간순 정렬
  Array.from(scheduleMap.values()).forEach(item => {
    item.schedule.sort((a, b) => {
      const [ah, am] = a.time.split(':').map(Number);
      const [bh, bm] = b.time.split(':').map(Number);
      return (ah * 60 + am) - (bh * 60 + bm);
    });
  });
  
  // 채널 순서 정렬
  const channelOrder = ['KBS1', 'KBS2', 'KBS NEWS D', 'KBS 라이프', 'KBS 드라마', 'KBS 조선'];
  const result = Array.from(scheduleMap.values());
  result.sort((a, b) => {
    const indexA = channelOrder.indexOf(a.channel.name);
    const indexB = channelOrder.indexOf(b.channel.name);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.channel.name.localeCompare(b.channel.name);
  });
  
  return result;
};

/**
 * TVmaze API를 통한 편성표 조회 (국제 API, 한국 채널 일부 지원)
 * @param {Date} date - 조회할 날짜
 * @param {string} country - 국가 코드 (기본값: 'KR')
 * @returns {Promise} 편성표 데이터
 */
export const fetchScheduleFromTVmaze = async (date, country = 'KR') => {
  const dateStr = formatDateForAPI(date, 'YYYY-MM-DD');
  
  // TVmaze API는 CORS를 지원하므로 직접 호출 가능
  const url = `https://api.tvmaze.com/schedule?country=${country}&date=${dateStr}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('TVmaze API 호출 실패');
    }
    
    const data = await response.json();
    console.log('TVmaze API 응답:', data.length, '개 항목');
    const parsed = parseTVmazeSchedule(data);
    console.log('파싱된 편성표:', parsed);
    return parsed;
  } catch (error) {
    console.error('TVmaze API 오류:', error);
    throw error;
  }
};

/**
 * 날짜를 API 형식으로 변환
 */
const formatDateForAPI = (date, format = 'YYYYMMDD') => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  if (format === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }
  return `${year}${month}${day}`;
};

/**
 * 공공데이터포털 직업방송 편성표 파싱
 */
const parseJobTvSchedule = (data) => {
  // 직업방송 API 응답 구조 파싱
  if (data.response?.body?.items?.item) {
    const items = Array.isArray(data.response.body.items.item) 
      ? data.response.body.items.item 
      : [data.response.body.items.item];
    
    const scheduleMap = new Map();
    
    items.forEach(item => {
      const channelName = '직업방송'; // 직업방송은 단일 채널
      const channelId = 1;
      
      if (!scheduleMap.has(channelName)) {
        scheduleMap.set(channelName, {
          channel: {
            id: channelId,
            name: channelName,
            logo: '📺'
          },
          schedule: []
        });
      }
      
      const scheduleItem = scheduleMap.get(channelName);
      const airTime = String(item.airTime || '00').padStart(2, '0');
      const airMinute = String(item.airMinute || '00').padStart(2, '0');
      const timeStr = `${airTime}:${airMinute}`;
      
      scheduleItem.schedule.push({
        time: timeStr,
        program: item.programName || item.title || '프로그램',
        duration: item.airMinute || 60,
        description: item.programContent || item.description || ''
      });
    });
    
    return Array.from(scheduleMap.values());
  }
  return [];
};

/**
 * KBS 편성표 데이터 파싱
 */
const parseKBSSchedule = (html) => {
  // HTML 파싱 로직 (실제 구조에 맞게 수정 필요)
  // 또는 JSON 응답인 경우 JSON.parse 사용
  try {
    const data = JSON.parse(html);
    return data.map(item => ({
      channel: {
        id: item.channelId,
        name: item.channelName,
        logo: '📺'
      },
      schedule: item.schedule.map(program => ({
        time: program.time,
        program: program.title,
        duration: program.duration,
        description: program.description || ''
      }))
    }));
  } catch (error) {
    console.error('KBS 데이터 파싱 오류:', error);
    return [];
  }
};

/**
 * TVmaze 편성표 데이터 파싱
 */
const parseTVmazeSchedule = (data) => {
  // TVmaze API 응답을 우리 형식으로 변환
  const channelMap = new Map();
  
  if (!data || data.length === 0) {
    return [];
  }
  
  data.forEach(item => {
    // 채널명 추출 (network 또는 webChannel)
    const network = item.show?.network || item.show?.webChannel;
    if (!network) return;
    
    const channelName = network.name || 'Unknown';
    const channelId = network.id || 0;
    
    if (!channelMap.has(channelName)) {
      channelMap.set(channelName, {
        channel: {
          id: channelId,
          name: channelName,
          logo: '📺'
        },
        schedule: []
      });
    }
    
    const scheduleItem = channelMap.get(channelName);
    
    // 시간 파싱 (airdate와 airtime 조합)
    let startTime;
    if (item.airdate && item.airtime) {
      // 한국 시간대 고려 (UTC+9)
      const dateTimeStr = `${item.airdate}T${item.airtime}:00+09:00`;
      startTime = new Date(dateTimeStr);
    } else if (item.airstamp) {
      startTime = new Date(item.airstamp);
    } else {
      return; // 시간 정보가 없으면 스킵
    }
    
    const hours = startTime.getHours();
    const minutes = startTime.getMinutes();
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    const duration = item.runtime || 60;
    
    // 프로그램명 추출 (한국어 우선)
    // TVmaze API는 영어로 제공되므로, 한국어 매핑 시도
    let programName = item.name || item.show?.name || 'Unknown';
    
    // 한국어 프로그램명 매핑 (주요 프로그램)
    const koreanProgramNames = {
      'A Graceful Liar': '친밀한 리플리',
      'Marie and Her Three Daddies': '마리와 세 아빠',
      'Spring Fever': '봄날의 열병',
      'TO DO X TXT': '투두 X TXT',
      'Episode': '에피소드'
    };
    
    // 쇼명이 한국어 매핑에 있으면 사용
    if (item.show?.name && koreanProgramNames[item.show.name]) {
      if (item.number) {
        programName = `${koreanProgramNames[item.show.name]} ${item.number}화`;
      } else {
        programName = koreanProgramNames[item.show.name];
      }
    } else if (item.show?.name) {
      // 쇼명 사용하고 에피소드 번호 추가
      if (item.number && item.name?.includes('Episode')) {
        programName = `${item.show.name} ${item.number}화`;
      } else if (item.show.name) {
        programName = item.show.name;
      }
    }
    
    // description도 한국어로 변환 시도
    let description = item.show?.summary || item.summary || '';
    // HTML 태그 제거
    if (description) {
      description = description.replace(/<[^>]*>/g, '');
    }
    
    scheduleItem.schedule.push({
      time: timeStr,
      program: programName,
      duration: duration,
      description: description,
      originalName: item.name, // 원본 영어명 보관
      showName: item.show?.name // 쇼명 보관
    });
  });
  
  // 각 채널의 편성표를 시간순으로 정렬
  const result = Array.from(channelMap.values()).map(item => {
    // 시간순 정렬
    item.schedule.sort((a, b) => {
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      const minutesA = timeA[0] * 60 + timeA[1];
      const minutesB = timeB[0] * 60 + timeB[1];
      return minutesA - minutesB;
    });
    
    // 실제 프로그램만 반환 (24시간 형식으로 채우지 않음)
    // 프로그램이 시작 시간에 맞춰 표시되도록 함
    return {
      channel: item.channel,
      schedule: item.schedule
    };
  });
  
  // 채널명으로 정렬 (KBS1, KBS2, MBC, SBS 순서)
  const channelOrder = ['KBS1', 'KBS2', 'MBC', 'SBS', 'JTBC', 'tvN', 'ENA', 'MBN', '채널A'];
  result.sort((a, b) => {
    const indexA = channelOrder.indexOf(a.channel.name);
    const indexB = channelOrder.indexOf(b.channel.name);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.channel.name.localeCompare(b.channel.name);
  });
  
  return result;
};

/**
 * EPG API를 통한 편성표 조회 (무료 공개 API)
 */
export const fetchScheduleFromEPG = async (date) => {
  const dateStr = formatDateForAPI(date, 'YYYY-MM-DD');
  
  // EPG API는 여러 국가의 편성표를 제공 (한국 포함)
  const url = `https://epg-api.video.globo.com/programmes/${dateStr}?channels=kr`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('EPG API 호출 실패');
    }
    const data = await response.json();
    return parseEPGSchedule(data);
  } catch (error) {
    console.error('EPG API 오류:', error);
    throw error;
  }
};

/**
 * EPG 편성표 데이터 파싱
 */
const parseEPGSchedule = (data) => {
  // EPG API 응답 구조에 맞게 파싱
  if (data && data.programmes) {
    const channelMap = new Map();
    
    data.programmes.forEach(item => {
      const channelName = item.channel?.name || 'Unknown';
      const channelId = item.channel?.id || 0;
      
      if (!channelMap.has(channelName)) {
        channelMap.set(channelName, {
          channel: {
            id: channelId,
            name: channelName,
            logo: '📺'
          },
          schedule: []
        });
      }
      
      const scheduleItem = channelMap.get(channelName);
      const startTime = new Date(item.start);
      const endTime = new Date(item.end);
      const duration = (endTime - startTime) / 1000 / 60; // 분 단위
      
      scheduleItem.schedule.push({
        time: `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`,
        program: item.title || item.name || '프로그램',
        duration: duration,
        description: item.description || ''
      });
    });
    
    return Array.from(channelMap.values());
  }
  return [];
};

/**
 * 통합 편성표 조회 함수 (여러 소스에서 데이터 가져오기)
 */
export const fetchTVSchedule = async (date, source = 'tvmaze') => {
  try {
    switch (source) {
      case 'datagokr':
        return await fetchScheduleFromDataGoKr(date);
      case 'kbs':
        return await fetchScheduleFromKBS(date);
      case 'epg':
        return await fetchScheduleFromEPG(date);
      case 'tvmaze':
      default:
        return await fetchScheduleFromTVmaze(date);
    }
  } catch (error) {
    console.error('편성표 조회 오류:', error);
    // 오류 발생 시 빈 배열 반환 또는 기본 데이터 반환
    return [];
  }
};

