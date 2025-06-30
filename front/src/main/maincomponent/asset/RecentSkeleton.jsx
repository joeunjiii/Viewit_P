import "../css/Recentsection.css";

function RecentSkeleton({ count = 5 }) {
    return (
        <div className="Recent-section">
            <div className="Recent-header">
                <div className="skeleton-header-icon" />
                <div className="skeleton skeleton-header-title" />
            </div>

            <div className="Recent-list">
                {Array.from({ length: count }).map((_, idx) => (
                    <div className="Recent-card skeleton-card" key={idx}>
                        <div className="Recent-card-info">
                            <div className="skeleton skeleton-title-card-item"></div>
                            <div className="skeleton skeleton-label-card-item"></div>
                        </div>
                        <div className="skeleton-card-badges-item">
                            <div className="skeleton skeleton-badge-card-item"></div> {/* 뱃지 스켈레톤 1 */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RecentSkeleton;