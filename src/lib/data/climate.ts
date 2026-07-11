// 中国建筑气候分区映射表 - 依据GB 50178-1993 / GB 55015-2021
// 数据来源: assets/climate_zones.json

export type ClimateZone =
  | "severe_cold"
  | "cold"
  | "hot_summer_cold_winter"
  | "hot_summer_warm_winter"
  | "mild";

export interface CityInfo {
  name: string;
  province: string;
  zone: ClimateZone;
}

export const CLIMATE_ZONE_LABELS: Record<ClimateZone, string> = {
  severe_cold: "严寒地区",
  cold: "寒冷地区",
  hot_summer_cold_winter: "夏热冬冷地区",
  hot_summer_warm_winter: "夏热冬暖地区",
  mild: "温和地区",
};

export const CLIMATE_ZONE_DESCRIPTIONS: Record<ClimateZone, string> = {
  severe_cold: "采暖度日数>5500，冬季极寒，保温要求最高",
  cold: "采暖度日数3800-5500，冬季寒冷",
  hot_summer_cold_winter: "采暖度日数1500-3800，夏季炎热冬季湿冷",
  hot_summer_warm_winter: "采暖度日数<1500，全年高温以隔热为主",
  mild: "采暖度日数1500-2500，气候温和",
};

// 完整城市列表 - 从JSON数据展开
const rawZones = {
  severe_cold: [
    { province: "黑龙江", cities: ["哈尔滨", "齐齐哈尔", "牡丹江", "佳木斯", "大庆", "鸡西", "双鸭山", "绥化", "伊春", "七台河", "鹤岗", "黑河", "大兴安岭"] },
    { province: "吉林", cities: ["长春", "吉林", "四平", "辽源", "通化", "白山", "松原", "白城"] },
    { province: "内蒙古", cities: ["呼和浩特", "包头", "乌海", "赤峰", "通辽", "鄂尔多斯", "呼伦贝尔", "巴彦淖尔", "乌兰察布", "兴安盟", "锡林郭勒"] },
    { province: "新疆", cities: ["乌鲁木齐", "克拉玛依", "伊犁", "阿勒泰", "塔城", "博乐", "哈密", "昌吉", "石河子", "奎屯"] },
    { province: "西藏", cities: ["拉萨", "日喀则", "那曲", "阿里"] },
    { province: "青海", cities: ["西宁", "海东", "海北", "海南", "黄南", "果洛", "玉树"] },
  ],
  cold: [
    { province: "北京", cities: ["北京"] },
    { province: "天津", cities: ["天津"] },
    { province: "河北", cities: ["石家庄", "唐山", "保定", "邯郸", "秦皇岛", "张家口", "承德", "沧州", "廊坊", "衡水", "邢台"] },
    { province: "山西", cities: ["太原", "大同", "阳泉", "长治", "晋城", "朔州", "晋中", "运城", "忻州", "临汾", "吕梁"] },
    { province: "辽宁", cities: ["沈阳", "大连", "鞍山", "抚顺", "本溪", "丹东", "锦州", "营口", "阜新", "辽阳", "盘锦", "铁岭", "朝阳", "葫芦岛"] },
    { province: "山东", cities: ["济南", "青岛", "淄博", "枣庄", "东营", "烟台", "潍坊", "济宁", "泰安", "威海", "日照", "临沂", "德州", "聊城", "滨州", "菏泽"] },
    { province: "河南", cities: ["郑州", "开封", "洛阳", "平顶山", "安阳", "鹤壁", "新乡", "焦作", "濮阳", "许昌", "漯河", "三门峡", "南阳", "商丘", "信阳", "周口", "驻马店"] },
    { province: "陕西", cities: ["西安", "铜川", "宝鸡", "咸阳", "渭南", "延安", "汉中", "榆林", "安康", "商洛"] },
    { province: "甘肃", cities: ["兰州", "嘉峪关", "金昌", "白银", "天水", "武威", "张掖", "平凉", "酒泉", "庆阳", "定西", "陇南"] },
    { province: "宁夏", cities: ["银川", "石嘴山", "吴忠", "固原", "中卫"] },
    { province: "新疆", cities: ["喀什", "和田", "阿克苏", "吐鲁番", "库尔勒"] },
    { province: "江苏", cities: ["徐州", "连云港", "宿迁"] },
    { province: "安徽", cities: ["淮北", "亳州", "宿州"] },
    { province: "西藏", cities: ["林芝"] },
  ],
  hot_summer_cold_winter: [
    { province: "上海", cities: ["上海"] },
    { province: "江苏", cities: ["南京", "无锡", "常州", "苏州", "南通", "淮安", "盐城", "扬州", "镇江", "泰州"] },
    { province: "浙江", cities: ["杭州", "宁波", "温州", "嘉兴", "湖州", "绍兴", "金华", "衢州", "舟山", "台州", "丽水"] },
    { province: "安徽", cities: ["合肥", "芜湖", "蚌埠", "淮南", "马鞍山", "铜陵", "安庆", "黄山", "滁州", "阜阳", "池州", "宣城"] },
    { province: "福建", cities: ["南平", "三明"] },
    { province: "江西", cities: ["南昌", "景德镇", "萍乡", "九江", "新余", "鹰潭", "赣州", "吉安", "宜春", "抚州", "上饶"] },
    { province: "河南", cities: ["信阳", "南阳"] },
    { province: "湖北", cities: ["武汉", "黄石", "十堰", "宜昌", "襄阳", "鄂州", "荆门", "孝感", "荆州", "黄冈", "咸宁", "随州", "恩施"] },
    { province: "湖南", cities: ["长沙", "株洲", "湘潭", "衡阳", "邵阳", "岳阳", "常德", "张家界", "益阳", "郴州", "永州", "怀化", "娄底", "湘西"] },
    { province: "四川", cities: ["成都", "自贡", "攀枝花", "泸州", "德阳", "绵阳", "广元", "遂宁", "内江", "乐山", "南充", "眉山", "宜宾", "广安", "达州", "雅安", "巴中", "资阳"] },
    { province: "重庆", cities: ["重庆"] },
    { province: "贵州", cities: ["遵义", "铜仁", "凯里"] },
    { province: "陕西", cities: ["汉中", "安康"] },
    { province: "甘肃", cities: ["陇南"] },
  ],
  hot_summer_warm_winter: [
    { province: "广东", cities: ["广州", "深圳", "珠海", "汕头", "佛山", "韶关", "湛江", "肇庆", "江门", "茂名", "惠州", "梅州", "汕尾", "河源", "阳江", "清远", "东莞", "中山", "潮州", "揭阳", "云浮"] },
    { province: "广西", cities: ["南宁", "柳州", "桂林", "梧州", "北海", "防城港", "钦州", "贵港", "玉林", "百色", "贺州", "河池", "来宾", "崇左"] },
    { province: "福建", cities: ["福州", "厦门", "莆田", "泉州", "漳州", "龙岩"] },
    { province: "海南", cities: ["海口", "三亚", "儋州", "琼海", "万宁", "文昌"] },
    { province: "云南", cities: ["西双版纳"] },
  ],
  mild: [
    { province: "云南", cities: ["昆明", "曲靖", "玉溪", "保山", "昭通", "丽江", "普洱", "临沧", "大理", "楚雄", "红河", "文山", "德宏", "怒江", "迪庆"] },
    { province: "贵州", cities: ["贵阳", "六盘水", "安顺", "毕节", "黔西南", "黔南", "黔东南"] },
  ],
} as const;

// 展开为扁平城市列表
export const CITIES: CityInfo[] = (() => {
  const list: CityInfo[] = [];
  (Object.entries(rawZones) as [ClimateZone, typeof rawZones[keyof typeof rawZones]][]).forEach(
    ([zone, provinces]) => {
      provinces.forEach(({ province, cities }) => {
        cities.forEach((city) => {
          list.push({ name: city, province, zone });
        });
      });
    }
  );
  return list;
})();

// 城市名 -> 气候分区 快速查找
export const CITY_ZONE_MAP: Record<string, ClimateZone> = (() => {
  const map: Record<string, ClimateZone> = {};
  CITIES.forEach((c) => {
    map[c.name] = c.zone;
  });
  return map;
})();
