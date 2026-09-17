//
//  HeatMapWidget.swift
//  HeatMap WidgetKit Extension (iOS & macOS)
//

import WidgetKit
import SwiftUI

struct HeatMapEntry: TimelineEntry {
    let date: Date
    let title: String
    let category: String
    let currentStreak: Int
    let longestStreak: Int
    let completionRate: Int
    let isTodayCompleted: Bool
    let recentLevels: [Int] // 0 to 4 for last 14 to 84 days
    let accentHex: String
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> HeatMapEntry {
        HeatMapEntry(
            date: Date(),
            title: "Strength Training",
            category: "Fitness",
            currentStreak: 12,
            longestStreak: 24,
            completionRate: 85,
            isTodayCompleted: true,
            recentLevels: [0, 1, 3, 2, 4, 3, 4, 2, 4, 1, 0, 3, 4, 4],
            accentHex: "#26A641"
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (HeatMapEntry) -> ()) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        // Read from shared App Group UserDefaults
        let defaults = UserDefaults(suiteName: "group.com.heatmap.tracker")
        let title = defaults?.string(forKey: "widget_title") ?? "Daily Goal"
        let streak = defaults?.integer(forKey: "widget_streak") ?? 7
        let longest = defaults?.integer(forKey: "widget_longest") ?? 15
        let rate = defaults?.integer(forKey: "widget_rate") ?? 80
        let completed = defaults?.bool(forKey: "widget_today_done") ?? false
        let hex = defaults?.string(forKey: "widget_accent") ?? "#26A641"
        
        let entry = HeatMapEntry(
            date: Date(),
            title: title,
            category: "Habit",
            currentStreak: streak,
            longestStreak: longest,
            completionRate: rate,
            isTodayCompleted: completed,
            recentLevels: [1, 2, 3, 4, 3, 4, 4, 2, 3, 4, 4, 4, 3, 4],
            accentHex: hex
        )

        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

struct HeatMapWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var accentColor: Color {
        Color(hex: entry.accentHex) ?? Color.green
    }

    var body: some View {
        switch family {
        case .systemSmall:
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(entry.title)
                        .font(.system(size: 12, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                        .lineLimit(1)
                    Spacer()
                    Circle()
                        .fill(entry.isTodayCompleted ? accentColor : Color(hex: "#30363D")!)
                        .frame(width: 7, height: 7)
                }

                Spacer()

                HStack(alignment: .firstTextBaseline, spacing: 3) {
                    Text("\(entry.currentStreak)")
                        .font(.system(size: 24, weight: .heavy, design: .monospaced))
                        .foregroundColor(accentColor)
                    Text("days")
                        .font(.system(size: 10, weight: .medium, design: .monospaced))
                        .foregroundColor(Color.gray)
                }

                Text(entry.isTodayCompleted ? "Logged today" : "Tap to complete")
                    .font(.system(size: 9, weight: .regular, design: .monospaced))
                    .foregroundColor(Color(hex: "#8B949E")!)

                // 14 mini cells
                LazyVGrid(columns: Array(repeating: GridItem(.fixed(12), spacing: 3), count: 7), spacing: 3) {
                    ForEach(0..<min(entry.recentLevels.count, 14), id: \.self) { idx in
                        RoundedRectangle(cornerRadius: 2)
                            .fill(levelColor(entry.recentLevels[idx]))
                            .frame(width: 12, height: 12)
                    }
                }
            }
            .padding(12)
            .background(Color(hex: "#0E1116")!)

        case .systemMedium:
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(entry.category.uppercased())
                            .font(.system(size: 8, weight: .bold, design: .monospaced))
                            .foregroundColor(Color(hex: "#6E7681")!)
                        Text(entry.title)
                            .font(.system(size: 14, weight: .bold, design: .monospaced))
                            .foregroundColor(.white)
                    }
                    Spacer()
                    Text("\(entry.currentStreak)d streak")
                        .font(.system(size: 11, weight: .bold, design: .monospaced))
                        .foregroundColor(accentColor)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(Color(hex: "#161B22")!)
                        .cornerRadius(3)
                }

                Spacer()

                // Mini matrix
                HStack(spacing: 4) {
                    ForEach(0..<4, id: \.self) { col in
                        VStack(spacing: 3) {
                            ForEach(0..<7, id: \.self) { row in
                                let idx = col * 7 + row
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(idx < entry.recentLevels.count ? levelColor(entry.recentLevels[idx]) : Color(hex: "#161B22")!)
                                    .frame(width: 9, height: 9)
                            }
                        }
                    }
                }

                HStack {
                    Text("Best: \(entry.longestStreak)d | Rate: \(entry.completionRate)%")
                        .font(.system(size: 9, design: .monospaced))
                        .foregroundColor(Color(hex: "#8B949E")!)
                    Spacer()
                    Text(entry.isTodayCompleted ? "Done" : "Pending")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                        .foregroundColor(entry.isTodayCompleted ? accentColor : Color.gray)
                }
            }
            .padding(12)
            .background(Color(hex: "#0E1116")!)

        default:
            VStack {
                Text(entry.title)
                    .font(.system(size: 13, weight: .bold, design: .monospaced))
                    .foregroundColor(.white)
            }
            .padding(12)
            .background(Color(hex: "#0E1116")!)
        }
    }

    func levelColor(_ level: Int) -> Color {
        switch level {
        case 1: return Color(hex: "#0E4429")!
        case 2: return Color(hex: "#006D32")!
        case 3: return Color(hex: "#26A641")!
        case 4: return Color(hex: "#39D353")!
        default: return Color(hex: "#161B22")!
        }
    }
}

@main
struct HeatMapWidget: Widget {
    let kind: String = "HeatMapWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            HeatMapWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("HeatMap Tracker")
        .description("Track your daily habit and fitness heatmaps.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

extension Color {
    init?(hex: String) {
        var str = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        if str.hasPrefix("#") { str.remove(at: str.startIndex) }
        guard str.count == 6 else { return nil }
        var rgbValue: UInt64 = 0
        Scanner(string: str).scanHexInt64(&rgbValue)
        self.init(
            .sRGB,
            red: Double((rgbValue & 0xFF0000) >> 16) / 255.0,
            green: Double((rgbValue & 0x00FF00) >> 8) / 255.0,
            blue: Double(rgbValue & 0x0000FF) / 255.0,
            opacity: 1.0
        )
    }
}
