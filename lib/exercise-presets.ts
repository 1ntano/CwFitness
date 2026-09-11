export const EXERCISE_PRESETS = [
  { name: "杠铃卧推", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "CHEST" },
  { name: "哑铃卧推", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "CHEST" },
  { name: "上斜杠铃卧推", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "CHEST" },
  { name: "上斜哑铃卧推", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "CHEST" },
  { name: "器械推胸", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "CHEST" },
  { name: "蝴蝶机夹胸", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "CHEST" },
  { name: "绳索夹胸", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "CHEST" },
  { name: "标准俯卧撑", resistanceType: "BODYWEIGHT", targetType: "REPETITIONS", muscleGroup: "CHEST" },

  { name: "引体向上", resistanceType: "BODYWEIGHT", targetType: "REPETITIONS", muscleGroup: "BACK" },
  { name: "高位下拉", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "BACK" },
  { name: "杠铃划船", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "BACK" },
  { name: "俯身划船", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "BACK" },
  { name: "单臂哑铃划船", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "BACK" },
  { name: "坐姿绳索划船", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "BACK" },
  { name: "直臂下压", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "BACK" },
  { name: "山羊挺身", resistanceType: "BODYWEIGHT", targetType: "REPETITIONS", muscleGroup: "BACK" },

  { name: "杠铃深蹲", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "LEGS" },
  { name: "高脚杯深蹲", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "LEGS" },
  { name: "腿举", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "LEGS" },
  { name: "罗马尼亚硬拉", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "LEGS" },
  { name: "保加利亚分腿蹲", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "LEGS" },
  { name: "哑铃弓步蹲", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "LEGS" },
  { name: "腿屈伸", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "LEGS" },
  { name: "俯卧腿弯举", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "LEGS" },

  { name: "站姿推举", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "SHOULDERS" },
  { name: "坐姿哑铃推举", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "SHOULDERS" },
  { name: "哑铃侧平举", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "SHOULDERS" },
  { name: "绳索侧平举", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "SHOULDERS" },
  { name: "哑铃前平举", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "SHOULDERS" },
  { name: "反向飞鸟", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "SHOULDERS" },
  { name: "绳索面拉", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "SHOULDERS" },
  { name: "阿诺德推举", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "SHOULDERS" },

  { name: "杠铃弯举", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "ARMS" },
  { name: "哑铃弯举", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "ARMS" },
  { name: "锤式弯举", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "ARMS" },
  { name: "牧师凳弯举", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "ARMS" },
  { name: "绳索下压", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "ARMS" },
  { name: "仰卧臂屈伸", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "ARMS" },
  { name: "哑铃颈后臂屈伸", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "ARMS" },
  { name: "窄距俯卧撑", resistanceType: "BODYWEIGHT", targetType: "REPETITIONS", muscleGroup: "ARMS" },

  { name: "平板支撑", resistanceType: "BODYWEIGHT", targetType: "DURATION", muscleGroup: "CORE" },
  { name: "侧平板支撑", resistanceType: "BODYWEIGHT", targetType: "DURATION", muscleGroup: "CORE" },
  { name: "卷腹", resistanceType: "BODYWEIGHT", targetType: "REPETITIONS", muscleGroup: "CORE" },
  { name: "仰卧举腿", resistanceType: "BODYWEIGHT", targetType: "REPETITIONS", muscleGroup: "CORE" },
  { name: "悬垂举腿", resistanceType: "BODYWEIGHT", targetType: "REPETITIONS", muscleGroup: "CORE" },
  { name: "俄罗斯转体", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "CORE" },
  { name: "健腹轮", resistanceType: "BODYWEIGHT", targetType: "REPETITIONS", muscleGroup: "CORE" },
  { name: "死虫式", resistanceType: "BODYWEIGHT", targetType: "REPETITIONS", muscleGroup: "CORE" },

  { name: "波比跳", resistanceType: "BODYWEIGHT", targetType: "REPETITIONS", muscleGroup: "FULL_BODY" },
  { name: "壶铃摇摆", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "FULL_BODY" },
  { name: "农夫行走", resistanceType: "WEIGHTED", targetType: "DURATION", muscleGroup: "FULL_BODY" },
  { name: "土耳其起立", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "FULL_BODY" },
  { name: "杠铃高翻", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "FULL_BODY" },
  { name: "哑铃深蹲推举", resistanceType: "WEIGHTED", targetType: "REPETITIONS", muscleGroup: "FULL_BODY" },
  { name: "跳绳间歇", resistanceType: "BODYWEIGHT", targetType: "DURATION", muscleGroup: "FULL_BODY" },
  { name: "划船机 500 米", resistanceType: "BODYWEIGHT", targetType: "DURATION", muscleGroup: "FULL_BODY" },

  { name: "跑步机慢跑", resistanceType: "BODYWEIGHT", targetType: "DURATION", muscleGroup: "CARDIO" },
  { name: "椭圆机", resistanceType: "BODYWEIGHT", targetType: "DURATION", muscleGroup: "CARDIO" },
  { name: "动感单车", resistanceType: "BODYWEIGHT", targetType: "DURATION", muscleGroup: "CARDIO" },
  { name: "划船机", resistanceType: "BODYWEIGHT", targetType: "DURATION", muscleGroup: "CARDIO" },
  { name: "跳绳", resistanceType: "BODYWEIGHT", targetType: "DURATION", muscleGroup: "CARDIO" },
  { name: "开合跳", resistanceType: "BODYWEIGHT", targetType: "DURATION", muscleGroup: "CARDIO" },
  { name: "高抬腿", resistanceType: "BODYWEIGHT", targetType: "DURATION", muscleGroup: "CARDIO" },
  { name: "登山跑", resistanceType: "BODYWEIGHT", targetType: "DURATION", muscleGroup: "CARDIO" },
] as const satisfies ReadonlyArray<{
  name: string;
  resistanceType: "WEIGHTED" | "BODYWEIGHT";
  targetType: "REPETITIONS" | "DURATION";
  muscleGroup: "CHEST" | "BACK" | "LEGS" | "SHOULDERS" | "ARMS" | "CORE" | "FULL_BODY" | "CARDIO";
}>;

export type ExercisePreset = (typeof EXERCISE_PRESETS)[number];