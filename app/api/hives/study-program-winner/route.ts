/** @format */

/**
 * Study Program Winner API Endpoint
 * Returns the daily best study program based on average game score
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { StudyProgramWinnerResponse } from "@/types/game";

/**
 * GET /api/hives/study-program-winner
 * Query params:
 *  - date: YYYY-MM-DD (defaults to today)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date =
      searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Expected YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("get_study_program_winner", {
      p_game_date: date,
    });

    if (error) {
      console.error("Error fetching study program winner:", error);
      return NextResponse.json(
        { error: "Failed to fetch study program winner" },
        { status: 500 }
      );
    }

    const winnerRow = Array.isArray(data) && data.length > 0 ? data[0] : null;

    const response: StudyProgramWinnerResponse = {
      winner: winnerRow
        ? {
            study_program: winnerRow.study_program,
            avg_score: Number(winnerRow.avg_score),
            player_count: Number(winnerRow.player_count),
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error in study-program-winner endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}


