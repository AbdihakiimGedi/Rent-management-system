class RealTimeUpdateService {
    constructor() {
        this.subscribers = new Map();
        this.updateIntervals = new Map();
        this.isRunning = false;
    }

    // Subscribe to real-time updates for a specific booking
    subscribe(bookingId, callback, intervalMs = 5000) {
        if (this.subscribers.has(bookingId)) {
            // Already subscribed, just add the callback
            this.subscribers.get(bookingId).push(callback);
        } else {
            // New subscription
            this.subscribers.set(bookingId, [callback]);
            this.startUpdates(bookingId, intervalMs);
        }

        // Return unsubscribe function
        return () => this.unsubscribe(bookingId, callback);
    }

    // Unsubscribe from updates
    unsubscribe(bookingId, callback) {
        const callbacks = this.subscribers.get(bookingId);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }

            // If no more callbacks, stop updates for this booking
            if (callbacks.length === 0) {
                this.stopUpdates(bookingId);
                this.subscribers.delete(bookingId);
            }
        }
    }

    // Start updates for a specific booking
    startUpdates(bookingId, intervalMs) {
        if (this.updateIntervals.has(bookingId)) {
            return; // Already running
        }

        const interval = setInterval(async () => {
            try {
                // Fetch latest booking data
                const response = await this.fetchBookingData(bookingId);

                // Notify all subscribers
                const callbacks = this.subscribers.get(bookingId);
                if (callbacks) {
                    callbacks.forEach(callback => {
                        try {
                            callback(response);
                        } catch (error) {
                            console.error('Error in real-time update callback:', error);
                        }
                    });
                }
            } catch (error) {
                console.error('Error fetching real-time update for booking:', bookingId, error);
            }
        }, intervalMs);

        this.updateIntervals.set(bookingId, interval);
    }

    // Stop updates for a specific booking
    stopUpdates(bookingId) {
        const interval = this.updateIntervals.get(bookingId);
        if (interval) {
            clearInterval(interval);
            this.updateIntervals.delete(bookingId);
        }
    }

    // Fetch booking data (this will be overridden by the component)
    async fetchBookingData(bookingId) {
        // This is a placeholder - the actual implementation will be provided by the component
        throw new Error('fetchBookingData must be implemented by the component');
    }

    // Stop all updates
    stopAll() {
        this.updateIntervals.forEach(interval => clearInterval(interval));
        this.updateIntervals.clear();
        this.subscribers.clear();
    }

    // Get subscription count for debugging
    getSubscriptionCount(bookingId) {
        const callbacks = this.subscribers.get(bookingId);
        return callbacks ? callbacks.length : 0;
    }

    // Check if updates are running for a booking
    isRunningFor(bookingId) {
        return this.updateIntervals.has(bookingId);
    }
}

// Create singleton instance
const realTimeUpdateService = new RealTimeUpdateService();

export default realTimeUpdateService;






