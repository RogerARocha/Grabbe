using System.Text.Json.Serialization;

namespace Grabbe.API.Infrastructure.ExternalClients.AniList;

public class AniListGraphQLResponse<T>
{
    [JsonPropertyName("data")]
    public T? Data { get; set; }

    [JsonPropertyName("errors")]
    public List<AniListGraphQLError>? Errors { get; set; }
}

public class AniListGraphQLError
{
    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public int? Status { get; set; }
}

public class AniListSearchDataContainer
{
    [JsonPropertyName("Page")]
    public AniListPageContainer? Page { get; set; }
}

public class AniListDetailDataContainer
{
    [JsonPropertyName("Media")]
    public AniListMedia? Media { get; set; }
}

public class AniListPageContainer
{
    [JsonPropertyName("media")]
    public List<AniListMedia>? Media { get; set; }
}

public class AniListMedia
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("idMal")]
    public int? IdMal { get; set; }

    [JsonPropertyName("title")]
    public AniListTitle? Title { get; set; }

    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("format")]
    public string? Format { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("startDate")]
    public AniListFuzzyDate? StartDate { get; set; }

    [JsonPropertyName("episodes")]
    public int? Episodes { get; set; }

    [JsonPropertyName("chapters")]
    public int? Chapters { get; set; }

    [JsonPropertyName("volumes")]
    public int? Volumes { get; set; }

    [JsonPropertyName("duration")]
    public int? Duration { get; set; }

    [JsonPropertyName("coverImage")]
    public AniListCoverImage? CoverImage { get; set; }

    [JsonPropertyName("genres")]
    public List<string>? Genres { get; set; }

    [JsonPropertyName("averageScore")]
    public double? AverageScore { get; set; }

    [JsonPropertyName("studios")]
    public AniListStudioConnection? Studios { get; set; }

    [JsonPropertyName("staff")]
    public AniListStaffConnection? Staff { get; set; }

    [JsonPropertyName("isAdult")]
    public bool? IsAdult { get; set; }
}

public class AniListTitle
{
    [JsonPropertyName("userPreferred")]
    public string? UserPreferred { get; set; }

    [JsonPropertyName("english")]
    public string? English { get; set; }

    [JsonPropertyName("romaji")]
    public string? Romaji { get; set; }

    [JsonPropertyName("native")]
    public string? Native { get; set; }
}

public class AniListFuzzyDate
{
    [JsonPropertyName("year")]
    public int? Year { get; set; }
}

public class AniListCoverImage
{
    [JsonPropertyName("extraLarge")]
    public string? ExtraLarge { get; set; }

    [JsonPropertyName("large")]
    public string? Large { get; set; }

    [JsonPropertyName("medium")]
    public string? Medium { get; set; }
}

public class AniListStudioConnection
{
    [JsonPropertyName("nodes")]
    public List<AniListStudioNode>? Nodes { get; set; }
}

public class AniListStudioNode
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class AniListStaffConnection
{
    [JsonPropertyName("edges")]
    public List<AniListStaffEdge>? Edges { get; set; }
}

public class AniListStaffEdge
{
    [JsonPropertyName("role")]
    public string? Role { get; set; }

    [JsonPropertyName("node")]
    public AniListStaffNode? Node { get; set; }
}

public class AniListStaffNode
{
    [JsonPropertyName("name")]
    public AniListStaffName? Name { get; set; }
}

public class AniListStaffName
{
    [JsonPropertyName("full")]
    public string? Full { get; set; }
}
