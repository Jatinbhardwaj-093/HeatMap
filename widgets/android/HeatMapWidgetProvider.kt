package com.heatmap.tracker

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class HeatMapWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val prefs = context.getSharedPreferences("HeatMapWidgetPrefs", Context.MODE_PRIVATE)
        val title = prefs.getString("widget_title", "Daily Goal") ?: "Daily Goal"
        val streak = prefs.getInt("widget_streak", 0)
        val isDoneToday = prefs.getBoolean("widget_today_done", false)

        // Standard RemoteViews setup
        // R.layout.widget_heatmap_layout is the corresponding XML resource
        // PendingIntent launches MainActivity
        val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // In production:
        // val views = RemoteViews(context.packageName, R.layout.widget_heatmap_layout)
        // views.setTextViewText(R.id.widget_title, title)
        // views.setTextViewText(R.id.widget_streak, "${streak}d streak")
        // views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)
        // appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}
